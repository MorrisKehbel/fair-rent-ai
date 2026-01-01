import pandas as pd

# --- MAPPINGS ---
CONDITION_MAP = {
    'ripe_for_demolition': 0, 'needs_renovation': 1, 'negotiable': 2,
    'well_kept': 3, 'modernized': 4, 'refurbished': 4, 'fully_renovated': 5,
    'mint_condition': 6, 'first_time_use': 7, 'first_time_use_after_refurbishment': 7
}

QUALITY_MAP = {'simple': 1, 'normal': 2, 'sophisticated': 3, 'luxury': 4}

ENERGY_CLASS_MAP = {
    'A_PLUS': 9, 'A+': 9, 'A': 8, 'B': 7, 'C': 6, 
    'D': 5, 'E': 4, 'F': 3, 'G': 2, 'H': 1
}

FLAT_TYPE_MAP = {
    'souterrain': 1, 'basement': 1, 'ground_floor': 2, 'apartment': 3,
    'maisonette': 4, 'roof_storey': 4, 'penthouse': 6
}

HEATING_MAP = {
    'stove_heating': 1, 'gas_heating': 2, 'oil_heating': 2, 
    'central_heating': 2, 'district_heating': 3, 'heat_pump': 5, 'floor_heating': 6
}

def clean_and_score_data(raw_json_data):

    # flatten JSON
    df = pd.json_normalize(raw_json_data)
    
    # select relevant features
    features = [
        'rent_cold', 'ancillary_costs', 'size', 'rooms', 'bathrooms', 'floor',
        'attributes.obj_condition', 'year_constructed', 'attributes.obj_lastRefurbish',
        'attributes.obj_interiorQual', 'type_of_flat', 'attributes.obj_thermalChar',
        'attributes.obj_energyEfficiencyClass', 'attributes.obj_heatingType',
        'balcony_terrace', 'fitted_kitchen', 'elevator', 'zip_code', 'city_district',
        'location_lat', 'location_lng'
    ]
    
    # use only existing columns
    existing_cols = [c for c in features if c in df.columns]
    df_ml = df[existing_cols].copy()
    
    # rename columns
    rename_map = {
        'attributes.obj_condition': 'condition',
        'attributes.obj_lastRefurbish': 'last_refurbished',
        'attributes.obj_interiorQual': 'quality',
        'attributes.obj_thermalChar': 'energy_consumption_kwh',
        'attributes.obj_energyEfficiencyClass': 'energy_class',
        'attributes.obj_heatingType': 'heating_type'
    }
    df_ml = df_ml.rename(columns=rename_map)
    
    # feature Engineering
    if 'condition' in df_ml.columns:
        df_ml['condition_score'] = df_ml['condition'].map(CONDITION_MAP).fillna(3) # default to 'well_kept' = 3
        
    if 'quality' in df_ml.columns:
        df_ml['quality_score'] = df_ml['quality'].map(QUALITY_MAP).fillna(2) # default to 'normal' = 2
        
    if 'energy_class' in df_ml.columns:
        df_ml['energy_class_score'] = df_ml['energy_class'].map(ENERGY_CLASS_MAP).fillna(4) # default to 'E' = 4

    if 'type_of_flat' in df_ml.columns:
        df_ml['flat_type_score'] = df_ml['type_of_flat'].map(FLAT_TYPE_MAP).fillna(3) # default to 'apartment' = 3

    if 'heating_type' in df_ml.columns:
        df_ml['heating_score'] = df_ml['heating_type'].map(HEATING_MAP).fillna(2) # default to 'central_heating' = 2

    # boolean Cleanup
    bool_cols = ['balcony_terrace', 'fitted_kitchen', 'elevator']
    for col in bool_cols:
        if col in df_ml.columns:
            df_ml[col] = df_ml[col].astype(str).str.lower().str.startswith(('t', 'y', 'j', '1')).astype(int)

    # numeric Cleanup
    numeric_cols = ['rent_cold', 'size', 'rooms', 'year_constructed', 'last_refurbished', 'energy_consumption_kwh']
    for col in numeric_cols:
        if col in df_ml.columns:
            df_ml[col] = pd.to_numeric(df_ml[col], errors='coerce')

    # filter outliers
    df_ml = df_ml[(df_ml['rent_cold'] > 200) & (df_ml['rent_cold'] < 4000)]
    
    df_ml = df_ml[(df_ml['size'] > 15) & (df_ml['size'] < 300)]
    
    price_per_sqm = df_ml['rent_cold'] / df_ml['size']
    df_ml = df_ml[(price_per_sqm > 3.0) & (price_per_sqm < 35.0)]

    df_ml = df_ml[(df_ml['year_constructed'] > 1900)]

    df_ml = df_ml.dropna(subset=['rent_cold'])

    return df_ml