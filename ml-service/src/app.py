import json
import os
import mlflow
import mlflow.sklearn
import s3fs

from mlflow.tracking import MlflowClient
from mlflow.models.signature import infer_signature

from immo_processor import clean_and_score_data
from immo_ml import train_model

MODEL_NAME = "Rent_Price_Predictor"

def main():
    mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI")
    if mlflow_tracking_uri:
        mlflow.set_tracking_uri(mlflow_tracking_uri)
# Loading Data
    mlflow.set_experiment("Rent_Price_Predictor_V1")
    bucket_uri = os.getenv("MLFLOW_S3_BUCKET")
    file_path = f"{bucket_uri}data/latest_data.json"
    
    print(f"Loading dataset from: {file_path} ...")
    
    fs = s3fs.S3FileSystem()
    
    try:
        with fs.open(file_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            
        print(f"Dataset successfully loaded ({len(raw_data)} records).")
        
    except Exception as e:
        print(f"Error loading dataset from {file_path}. Error: {e}")
        return
    
# Data Cleaning and Preprocessing Features
    df_clean = clean_and_score_data(raw_data)
    df_clean = df_clean.dropna(subset=['rent_cold'])


# Model Training and Logging with MLflow
    with mlflow.start_run() as run:
        mlflow.log_param("num_samples", len(df_clean))
        
        print("Starte Training...")
        model, r2 = train_model(df_clean)
        mlflow.log_metric("r2_score", r2)
        print(f"Training beendet. R2: {r2:.4f}")

        # --- create signature ---
        input_example = df_clean.drop(columns=['rent_cold']).iloc[[0]]  # example input for mlflow model signature
        prediction = model.predict(df_clean.iloc[[0]])  # example prediction for mlflow model output signature
        
        signature = infer_signature(input_example, prediction)
        # -------------------------

        # save the model with signature and input example
        mlflow.sklearn.log_model(
            sk_model=model, 
            artifact_path="model",
            registered_model_name=MODEL_NAME,
            signature=signature,
            input_example=input_example
        )
        
        client = MlflowClient()

        # check if a champion model exists
        try:
            champion_version = client.get_model_version_by_alias(MODEL_NAME, "champion")
            champion_run_id = champion_version.run_id
            champion_r2 = client.get_run(champion_run_id).data.metrics.get("r2_score", 0)
        except:
            champion_r2 = -1.0
            print("No champion model found")

        print(f"Comparison: New Model({r2:.4f}) vs. Champion Model ({champion_r2:.4f})")
        
        # test if new model is better than champion model --- maybe chabge to other metric or add tolerance later ---
        if r2 > (champion_r2 + 0.01):
            print("New model is better. Updating champion...")
            
            mv = client.search_model_versions(f"run_id='{run.info.run_id}'")[0]

            client.set_registered_model_alias(MODEL_NAME, "champion", mv.version)
        else:
            print("New model is worse or equal. Champion model remains.")

if __name__ == "__main__":
    main()