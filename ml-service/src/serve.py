import mlflow.sklearn
import pandas as pd
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mlflow.tracking import MlflowClient
from datetime import datetime
from typing import Optional

MODEL_NAME = "Rent_Price_Predictor"

model = None

# # -----------------------------
# LOAD LATEST CHAMPION MODEL
# # -----------------------------
def load_model_logic():
    global model

    mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI")

    if mlflow_tracking_uri:
        mlflow.set_tracking_uri(mlflow_tracking_uri)

    try:
        model_uri = f"models:/{MODEL_NAME}@champion"

        print(f"Loading model from: {model_uri} ...")
        model = mlflow.sklearn.load_model(model_uri)
        print("Model successfully loaded.")
        return True
    except Exception as e:
        print(f"No model found. {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model_logic()
    yield

# # -----------------------------
# CONNECTION
# # -----------------------------
app = FastAPI(title="Rent Price Predictor API", lifespan=lifespan)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["ALLOWED_ORIGINS"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # -----------------------------
# SCHEMAS
# # -----------------------------
class RentRequest(BaseModel):
    size: float
    rooms: float
    # lat: Optional[float] = None
    # lng: Optional[float] = None
    year_constructed: Optional[int] = None

    city: Optional[str] = None
    zip_code: str
    region: Optional[str] = None

    elevator: Optional[bool] = None
    garden: Optional[bool] = None
    fitted_kitchen: Optional[bool] = None
    balcony_terrace: Optional[bool] = None
    cellar: Optional[bool] = None
    is_new_building: Optional[bool] = None
    # has_parking: Optional[bool] = None

# # -----------------------------
# ENDPOINTS
# # -----------------------------
@app.post("/predict")
def predict(request: RentRequest):
    global model
    # lazy loading - model might not be there if training hasn't finished yet
    if not model:
        print("No model loaded, attempting reload...")
        success = load_model_logic()
        if not success:
            raise HTTPException(status_code=503, detail="Model could not be loaded. Please wait and try again.")

    try:
        data_for_prediction = pd.DataFrame({
            'size': [request.size],
            'rooms': [request.rooms],
            # 'lat': [request.lat or 0],
            # 'lng': [request.lng or 0],
            'year_constructed': [request.year_constructed or 1996],

            'city': [request.city or "unknown"],
            'zip_code': [str(request.zip_code)],
            'region': [request.region or "unknown"],

            'elevator': [1 if request.elevator else 0],
            'garden': [1 if request.garden else 0], 
            'fitted_kitchen': [1 if request.fitted_kitchen else 0],
            'balcony_terrace': [1 if request.balcony_terrace else 0], 
            'cellar': [1 if request.cellar else 0],
            'is_new_building': [1 if request.is_new_building else 0]
            # 'has_parking': [1 if request.has_parking else 0],
        })

        # print(data_for_prediction.to_string())

        prediction = model.predict(data_for_prediction)
        return {"estimated_rent_cold": round(prediction[0], 2)}
    
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/model-info")
def get_model_info():
    global model

    mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI")
    if not mlflow_tracking_uri:
        raise HTTPException(status_code=500, detail="MLFLOW_TRACKING_URI not set")
    
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    client = MlflowClient()

    try:
        champion_version = client.get_model_version_by_alias(MODEL_NAME, "champion")
        run_id = champion_version.run_id
        
        run = client.get_run(run_id)
        
        creation_time = datetime.fromtimestamp(run.info.start_time / 1000.0).strftime('%Y-%m-%d') # gets date
        
        metrics = run.data.metrics # gets metrics

        top_features = []
        
        if model:
            try:
                rf_model = model.named_steps['regressor']
                preprocessor = model.named_steps['preprocessor']
                
                importances = rf_model.feature_importances_ # gets importances
                
                try:
                    feature_names = preprocessor.get_feature_names_out()
                except AttributeError:
                    # fallback
                    feature_names = [f"Feature_{i}" for i in range(len(importances))]
                
                feat_list = []
                for name, imp in zip(feature_names, importances):
                    feat_list.append({"feature": name, "importance": float(imp)})
                
                # sort take top 10
                feat_list.sort(key=lambda x: x['importance'], reverse=True)
                top_features = feat_list[:10]
                
            except Exception as e:
                print(f"Feature extraction failed: {e}")
                top_features = [{"error": "Could not extract features from model object"}]
        else:
             top_features = [{"warning": "Model not currently loaded in memory"}]

        return {
            "model_version": champion_version.version,
            "run_id": run_id,
            "last_updated": creation_time,
            "metrics": {
                "r2_score": metrics.get("r2_score"),
                "mae": metrics.get("mae"),
                "mape": metrics.get("mape")
            },
            "top_features": top_features
        }
    
    except Exception as e:
        print(f"Error fetching model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))