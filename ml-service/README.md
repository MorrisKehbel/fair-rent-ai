# ML Service

## Commands

Train new model:
docker compose run trainer

## API

POST /predict

## Environment (.env)

### AWS

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
MLFLOW_S3_BUCKET=

### Connection

ALLOWED_ORIGINS=

### DAGSHUB / MLflow

MLFLOW_TRACKING_URI=
MLFLOW_TRACKING_USERNAME=
MLFLOW_TRACKING_PASSWORD=
