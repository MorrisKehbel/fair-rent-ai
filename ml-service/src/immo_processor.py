import pandas as pd

def clean_and_score_data(raw_json_data):
    df = pd.json_normalize(raw_json_data)
    
    # loading raw data features
    features = [
        'rent_cold', 'size', 'rooms', 'year_constructed', 
        'zip_code', 'city', 'attributes.obj_regio4', 'balcony_terrace', 
        'fitted_kitchen', 'elevator', 'condition', 'garden', 'cellar',
        'no_of_parking_spaces',
        'location_lat', 'location_lng'
    ]

    existing_cols = [c for c in features if c in df.columns]
    df_ml = df[existing_cols].copy()

    # # -----------------------------
    #  FEATURE ENGINEERING
    # # -----------------------------
    # # NUMERIC FEATURES
    numeric_cols = ['rent_cold', 'size', 'rooms', 'year_constructed', 'location_lat', 'location_lng']

    for col in numeric_cols:
        if col in df_ml.columns:
            df_ml[col] = pd.to_numeric(df_ml[col], errors='coerce')  

    # # -----------------------------
    # # LOCATION FEATURES
    if 'city' in df_ml.columns:
        df_ml['city'] = df_ml['city'].astype(str).str.lower().str.strip()
    else:
        df_ml['city'] = 'unknown'

    if 'zip_code' in df_ml.columns:
        df_ml['zip_code'] = (
            df_ml['zip_code']
            .astype(str)
            .str.replace(r'\.0$', '', regex=True)
            .str.zfill(5)
        )

    df_ml['region'] = (
        df_ml.get('attributes.obj_regio4', 'unknown')
        .astype(str)
        .str.lower()
        .str.strip()
    )

    # # -----------------------------
    # # BOOLEAN FEATURES
    bool_cols = ['elevator', 'garden', 'fitted_kitchen', 'balcony_terrace', 'cellar']
    true_values = ["t", "y", "j", "1"]

    for col in bool_cols:
        if col in df_ml.columns:
            df_ml[col] = (df_ml[col].astype(str).str.lower().str.startswith(tuple(true_values)).astype(int))
        else:
            df_ml[col] = 0

    if 'condition' in df_ml.columns:
        new_keywords = ['first_time_use', 'first_time_use_after_refurbishment', 'mint_condition']

        df_ml['is_new_building'] = df_ml['condition'].isin(new_keywords).astype(int)
    else:
        df_ml['is_new_building'] = 0

    if 'no_of_parking_spaces' in df_ml.columns:
        parking_count = pd.to_numeric(df_ml['no_of_parking_spaces'], errors='coerce').fillna(0)
        df_ml['has_parking'] = (parking_count > 0).astype(int)
    else:
        df_ml['has_parking'] = 0

    # # -----------------------------
    # FILTERS (Outliers)
    # # -----------------------------
    price_per_sqm = df_ml['rent_cold'] / df_ml['size']

    df_ml = df_ml[
        (df_ml['rent_cold'] > 200) &
        (df_ml['rent_cold'] < 4000) &
        (df_ml['size'] > 20) &
        (df_ml['size'] < 300) &
        (df_ml['year_constructed'] > 1850) &
        (price_per_sqm > 3.0) &
        (price_per_sqm < 35.0) &
        (df_ml['location_lat'].between(47.0, 55.5)) &
        (df_ml['location_lng'].between(5.5, 15.5)) 
    ]

    # # -----------------------------
    # FINAL FEATURE SET
    # # -----------------------------
    final_cols = [
        'rent_cold', 'size', 'rooms', 'year_constructed', 
        'city', 'zip_code', 'region', 
        'elevator', 'garden', 'fitted_kitchen', 
        'balcony_terrace', 'cellar', 'is_new_building', 'has_parking',
        'location_lat', 'location_lng'
    ]
    
    df_ml = df_ml.dropna(subset=['rent_cold'])

    # fallback for missings cols
    for col in final_cols:
        if col not in df_ml.columns:
            df_ml[col] = 0
            
    return df_ml[final_cols]