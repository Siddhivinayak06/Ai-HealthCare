from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score
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
    
    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42
    )

    # 5-fold cross-validation before final fit
    cv_f1 = cross_val_score(model, X_processed, y, cv=5, scoring='f1')
    cv_auc = cross_val_score(model, X_processed, y, cv=5, scoring='roc_auc')
    print(f"📊 Cross-Validation Results (5-fold):")
    print(f"   F1    : {cv_f1.mean():.4f} ± {cv_f1.std():.4f}")
    print(f"   AUC   : {cv_auc.mean():.4f} ± {cv_auc.std():.4f}")

    model.fit(X_processed, y)
    joblib.dump(model, RISK_MODEL_PATH)
    print(f"💾 Model saved to {RISK_MODEL_PATH}")
    return model

def predict_patient_risk(model, data):
    input_df = pd.DataFrame([{
        'age': data.age, 'bmi': data.bmi, 'sys_bp': data.sys_bp, 
        'dia_bp': data.dia_bp, 'glucose': data.glucose, 
        'cholesterol': data.cholesterol, 'smoker': data.smoker
    }])
    input_df = preprocess_risk_features(input_df)
    
    try:
        risk_prob = model.predict_proba(input_df)[0][1]
    except Exception as e:
        print(f"❌ Risk Model Prediction Error: {e}")
        return {"error": f"Model prediction failed: {str(e)}"}

    risk_level = "High" if risk_prob > 0.7 else "Medium" if risk_prob > 0.35 else "Low"
    
    # --- Actionable Interventions Mapping ---
    factors_identified = []
    interventions = []
    
    # helper to add structured interventions
    def add_int(text, itype, priority):
        interventions.append({
            "text": text,
            "type": itype,
            "priority": priority,
            "action": "appointment" if itype == "clinical" else "manual"
        })

    # 1. Weight/BMI Management
    if data.bmi >= 30:
        factors_identified.append("Obesity (BMI ≥ 30)")
        add_int("Referral: Medical Nutrition Therapy & Weight Management Program", "clinical", "high")
    elif data.bmi >= 25:
        factors_identified.append("Overweight (BMI ≥ 25)")
        add_int("Lifestyle: Caloric deficit diet and increased physical activity", "lifestyle", "medium")

    # 2. Blood Pressure
    if data.sys_bp >= 140 or data.dia_bp >= 90:
        factors_identified.append("Stage 2 Hypertension")
        add_int("Clinical: Specialist consultation for antihypertensive medication", "clinical", "high")
        add_int("Monitoring: Daily blood pressure charting", "monitoring", "high")
    elif data.sys_bp >= 130 or data.dia_bp >= 80:
        factors_identified.append("Stage 1 Hypertension")
        add_int("Dietary: DASH diet (Low Sodium intake < 2300mg/day)", "lifestyle", "medium")

    # 3. Glycemic Control
    if data.glucose >= 126:
        factors_identified.append("Hyperglycemia (Diabetic Range)")
        add_int("Referral: Endocrinologist consultation & HbA1c testing", "clinical", "high")
    elif data.glucose >= 100:
        factors_identified.append("Prediabetic Glucose Levels")
        add_int("Dietary: Intensive glucose monitoring and carbohydrate restriction", "monitoring", "medium")

    # 4. Cholesterol
    if data.cholesterol >= 240:
        factors_identified.append("Hypercholesterolemia")
        add_int("Clinical: Statin therapy evaluation and lipid panel follow-up", "clinical", "high")

    # 5. Lifestyle
    if data.smoker:
        factors_identified.append("Active Smoking")
        add_int("Program: Immediate enrollment in Smoking Cessation pharmacotherapy", "clinical", "medium")

    # Fallbacks
    if not interventions:
        if risk_level == "High":
            add_int("Urgent: General clinical evaluation required", "clinical", "high")
        elif risk_level == "Medium":
            add_int("Recommended: Comprehensive wellness screening", "monitoring", "medium")
        else:
            add_int("Normal: Maintain current health monitoring protocols", "lifestyle", "low")

    return {
        "risk_score": float(risk_prob),
        "risk_level": risk_level,
        "recommendation": interventions,
        "factors": factors_identified,
        "features_analyzed": list(input_df.columns)
    }
