from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import numpy as np
import joblib
import os

RISK_MODEL_PATH = 'risk_model.joblib'

def get_risk_model():
    if os.path.exists(RISK_MODEL_PATH):
        try:
            return joblib.load(RISK_MODEL_PATH)
        except:
            return train_improved_risk_model()
    else:
        return train_improved_risk_model()

def preprocess_risk_features(df):
    """Engineers features for better risk prediction"""
    df = df.copy()
    # Feature Interaction: Metabolic Risk Index
    df['metabolic_index'] = (df['bmi'] * df['glucose']) / 100
    # Categorical Age Grouping
    df['senior_risk'] = (df['age'] > 65).astype(int)
    # Blood Pressure Severity
    df['hypertension_score'] = (df['sys_bp'] / 140) + (df['dia_bp'] / 90)
    return df

def train_improved_risk_model(data_df=None):
    """
    Trains the risk model. If data_df is provided, uses real data.
    Otherwise, generates synthetic data for demonstration.
    """
    if data_df is None:
        print("Generating synthetic training data...")
        np.random.seed(42)
        n_samples = 2000
        data = {
            'age': np.random.randint(20, 90, n_samples),
            'bmi': np.random.normal(27, 6, n_samples),
            'sys_bp': np.random.normal(130, 20, n_samples),
            'dia_bp': np.random.normal(85, 12, n_samples),
            'glucose': np.random.normal(105, 25, n_samples),
            'cholesterol': np.random.normal(210, 45, n_samples),
            'smoker': np.random.randint(0, 2, n_samples),
            'risk_label': None # Placeholder
        }
        X = pd.DataFrame(data)
        # Synthetic target with more complexity
        risk_score = (
            (X['age'] / 50) * 1.2 + 
            (X['bmi'] / 25) * 1.0 + 
            (X['glucose'] / 100) * 1.5 + 
            (X['smoker'] * 0.8) +
            (X['sys_bp'] / 140) * 0.5
        )
        y = (risk_score > np.percentile(risk_score, 75)).astype(int)
        X = X.drop(columns=['risk_label'])
    else:
        print(f"Training on real dataset ({len(data_df)} records)...")
        if 'risk_label' not in data_df.columns:
            raise ValueError("Dataset must contain 'risk_label' target column.")
        X = data_df.drop(columns=['risk_label'])
        y = data_df['risk_label']

    X_processed = preprocess_risk_features(X)
    
    model = RandomForestClassifier(
        n_estimators=100, 
        max_depth=10, 
        random_state=42
    )
    model.fit(X_processed, y)
    joblib.dump(model, RISK_MODEL_PATH)
    return model

def predict_patient_risk(model, data):
    input_df = pd.DataFrame([{
        'age': data.age, 'bmi': data.bmi, 'sys_bp': data.sys_bp, 
        'dia_bp': data.dia_bp, 'glucose': data.glucose, 
        'cholesterol': data.cholesterol, 'smoker': data.smoker
    }])
    input_df = preprocess_risk_features(input_df)
    
    # Handle version mismatch if any or corrupted model
    try:
        risk_prob = model.predict_proba(input_df)[0][1]
    except Exception as e:
        print(f"❌ Risk Model Prediction Error: {e}")
        # Fallback to simple prediction if feature names mismatch or model logic fails
        return {"error": f"Model prediction failed: {str(e)}"}

    risk_level = "High" if risk_prob > 0.7 else "Medium" if risk_prob > 0.35 else "Low"
    
    recs = []
    if risk_level == "High":
        recs.append("🔴 Urgent: Clinical evaluation for cardiovascular/metabolic risks required")
    elif risk_level == "Medium":
        recs.append("🟡 Recommended: Lifestyle modifications and follow-up in 3 months")
    else:
        recs.append("🟢 Normal: Continue standard health monitoring")

    return {
        "risk_score": float(risk_prob),
        "risk_level": risk_level,
        "recommendation": recs,
        "features_analyzed": list(input_df.columns)
    }
