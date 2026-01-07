from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, TargetEncoder
from sklearn.impute import SimpleImputer

def train_model(df):
    #setting goal
    y = df['rent_cold']

    # # -----------------------------
    # FEATURES SETTING / SELECTION
    # # -----------------------------
    numeric_features = ['size', 'rooms', 'year_constructed']# 'location_lat', 'location_lng'
    location_features = ['zip_code']#'city', , 'region'
    boolean_features = [
        'elevator', 'garden', 'fitted_kitchen', 
        'balcony_terrace', 'cellar', 'is_new_building'] #, 'has_parking'

    valid_numeric = [c for c in numeric_features if c in df.columns]
    valid_location = [c for c in location_features if c in df.columns]
    valid_boolean = [c for c in boolean_features if c in df.columns]


    X = df[valid_numeric + valid_location + valid_boolean]

    #splitting control and test data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    # # -----------------------------
    # TRANSFORM
    # # -----------------------------
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    location_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')), 
        ('target_enc', TargetEncoder(target_type='continuous', smooth=1.0))
    ])

    boolean_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value=0))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
        ('num', numeric_transformer, valid_numeric),
        ('loc', location_transformer, valid_location),
        ('bool', boolean_transformer, valid_boolean)
    ])

    # # -----------------------------
    # PIPELINE
    # # -----------------------------
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=600, min_samples_leaf=2, random_state=42, n_jobs=-1))
    ])

    # # -----------------------------
    # TRAINING
    # # -----------------------------
    model_pipeline.fit(X_train, y_train)

    return model_pipeline, X_test, y_test