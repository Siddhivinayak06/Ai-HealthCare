import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier

RISK_MODEL_PATH = 'risk_model.joblib'

def get_risk_model():
    if os.path.exists(RISK_MODEL_PATH):
        return joblib.load(RISK_MODEL_PATH)
    else:
        return train_synthetic_risk_model()

def train_synthetic_risk_model():
    print("Training synthetic risk model...")
    np.random.seed(42)
    n_samples = 1000
    
    age = np.random.randint(20, 90, n_samples)
    bmi = np.random.normal(25, 5, n_samples)
    sys_bp = np.random.normal(120, 15, n_samples)
    dia_bp = np.random.normal(80, 10, n_samples)
    glucose = np.random.normal(100, 20, n_samples)
    cholesterol = np.random.normal(200, 40, n_samples)
    smoker = np.random.randint(0, 2, n_samples)
    
    X = pd.DataFrame({
        'age': age, 'bmi': bmi, 'sys_bp': sys_bp, 'dia_bp': dia_bp,
        'glucose': glucose, 'cholesterol': cholesterol, 'smoker': smoker
    })
    
    risk_score = (
        (age / 90) * 2 + (bmi / 40) * 1.5 + (sys_bp / 180) * 1.5 + 
        (glucose / 200) * 2 + (smoker * 0.5)
    )
    y = (risk_score > np.percentile(risk_score, 70)).astype(int) 
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, RISK_MODEL_PATH)
    return model

def predict_patient_risk(model, data):
    input_df = pd.DataFrame([{
        'age': data.age, 'bmi': data.bmi, 'sys_bp': data.sys_bp, 
        'dia_bp': data.dia_bp, 'glucose': data.glucose, 
        'cholesterol': data.cholesterol, 'smoker': data.smoker
    }])
    risk_prob = model.predict_proba(input_df)[0][1]
    risk_level = "High" if risk_prob > 0.7 else "Medium" if risk_prob > 0.4 else "Low"
    
    recs = ["Consult doctor immediately"] if risk_level == "High" else ["Maintain healthy lifestyle"]
    
    return {
        "risk_score": float(risk_prob),
        "risk_level": risk_level,
        "recommendation": recs
    }
