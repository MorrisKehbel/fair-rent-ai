from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

def train_model(df):
    
    y = df['rent_cold']
    
# FEATURES SELECTION

    numeric_features = [
        'size', 'rooms', 'year_constructed', 'ancillary_costs', 
        'location_lat', 'location_lng' 
    ]
    
    categorical_features = ['heating_type', 'zip_code']
    
    ready_to_use_features = [
        'condition_score', 'quality_score', 'energy_class_score', 
        'flat_type_score', 'elevator', 'balcony_terrace', 'fitted_kitchen'
    ]
    
    # validation: only use features that exist in the dataframe
    valid_numeric = [c for c in numeric_features if c in df.columns]
    valid_categorical = [c for c in categorical_features if c in df.columns] 
    valid_ready = [c for c in ready_to_use_features if c in df.columns]
    
    X = df[valid_numeric + valid_categorical + valid_ready]
    
# 2. SPLIT
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. PIPELINE
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, valid_numeric),
            ('cat', categorical_transformer, valid_categorical),
            ('pass', 'passthrough', valid_ready)
        ])

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1))
    ])

# 4. TRAINING
    model_pipeline.fit(X_train, y_train)
    
    return model_pipeline, X_test, y_test