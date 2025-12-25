import mlflow.sklearn
import pandas as pd
import os

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_NAME = "Rent_Price_Predictor"

model = None

def load_model_logic():
    global model
# load the latest registered champion model
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

app = FastAPI(title="Rent Price Predictor API", lifespan=lifespan)


# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["ALLOWED_ORIGINS"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# default values for testing 
class RentRequest(BaseModel):
    size: float
    rooms: float
    zip_code: str = "04103" 
    lat: float = 0.0
    lng: float = 0.0
    year_constructed: int = 1990

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
    # input data 
        input_data = pd.DataFrame([request.dict()])

        data_for_prediction = pd.DataFrame({
            'size': [request.size],
            'rooms': [request.rooms],
            'year_constructed': [request.year_constructed],
            'location_lat': [request.lat],
            'location_lng': [request.lng],
            'zip_code': [str(request.zip_code)],

        # default scores for testing
            'ancillary_costs': [0],
            'heating_type': ['central_heating'],
            'condition_score': [3],
            'quality_score': [2], 
            'energy_class_score': [4],
            'flat_type_score': [3],
            'elevator': [0],
            'balcony_terrace': [0],
            'fitted_kitchen': [0]
        })

        prediction = model.predict(data_for_prediction)
        return {"estimated_rent_cold": round(prediction[0], 2)}
    
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=400, detail=str(e))