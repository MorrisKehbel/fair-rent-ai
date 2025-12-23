# imports
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# Loading Data
# Split Categorial and Numerical Features
# Start the Pipeline w/ Encoding
# Combine the Pipelines
# Split into training and testing datasets
# Train and predict Model
# Evaluate model accuracy