from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from PIL import Image
import torch
from torchvision import models, transforms
import io
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

app = FastAPI()

# --- 1. IMAGE MODEL SETUP (DenseNet121) ---
try:
    image_model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    if os.path.exists('medical_model.pth'):
        print("Loading trained medical model (Image)...")
        num_ftrs = image_model.classifier.in_features
        image_model.classifier = torch.nn.Linear(num_ftrs, 2)
        image_model.load_state_dict(torch.load('medical_model.pth', map_location=torch.device('cpu')))
        IMAGE_MODEL_TYPE = "Medical (Fine-Tuned)"
    else:
        print("Warning: Medical Image model not found. Using Generic ImageNet.")
        IMAGE_MODEL_TYPE = "Generic (ImageNet)"
    image_model.eval()
except Exception as e:
    print(f"Error loading image model: {e}")

image_preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


# --- 2. RISK MODEL SETUP (Random Forest) ---
RISK_MODEL_PATH = 'risk_model.joblib'
risk_model = None

def train_synthetic_risk_model():
    print("Training synthetic risk model...")
    # Generate fake medical data
    np.random.seed(42)
    n_samples = 1000
    
    # Features: Age, BMI, SystolicBP, DiastolicBP, Glucose, Cholesterol, Smoker(0/1)
    # Target: HighRisk(0/1)
    
    # Simple logic for synthetic ground truth:
    # Risk increases with Age, BMI, BP, Glucose
    
    age = np.random.randint(20, 90, n_samples)
    bmi = np.random.normal(25, 5, n_samples)
    sys_bp = np.random.normal(120, 15, n_samples)
    dia_bp = np.random.normal(80, 10, n_samples)
    glucose = np.random.normal(100, 20, n_samples)
    cholesterol = np.random.normal(200, 40, n_samples)
    smoker = np.random.randint(0, 2, n_samples)
    
    X = pd.DataFrame({
        'age': age,
        'bmi': bmi,
        'sys_bp': sys_bp,
        'dia_bp': dia_bp,
        'glucose': glucose,
        'cholesterol': cholesterol,
        'smoker': smoker
    })
    
    # Define a risk score for ground truth generation
    risk_score = (
        (age / 90) * 2 + 
        (bmi / 40) * 1.5 + 
        (sys_bp / 180) * 1.5 + 
        (glucose / 200) * 2 + 
        (smoker * 0.5)
    )
    
    # Threshold for "High Risk"
    y = (risk_score > np.percentile(risk_score, 70)).astype(int) 
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, RISK_MODEL_PATH)
    print("Synthetic risk model trained and saved.")
    return model

if os.path.exists(RISK_MODEL_PATH):
    print("Loading existing risk model...")
    risk_model = joblib.load(RISK_MODEL_PATH)
else:
    risk_model = train_synthetic_risk_model()


# --- API REQUEST MODELS ---
class RiskInput(BaseModel):
    age: int
    bmi: float
    sys_bp: int
    dia_bp: int
    glucose: int
    cholesterol: int
    smoker: int # 0 or 1

# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "ML Service Running", "image_model": IMAGE_MODEL_TYPE, "risk_model": "Active"}

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        input_tensor = image_preprocess(image)
        input_batch = input_tensor.unsqueeze(0) 

        with torch.no_grad():
            output = image_model(input_batch)
        
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, class_idx = torch.max(probabilities, 0)
        
        class_name = "Unknown"
        if IMAGE_MODEL_TYPE == "Medical (Fine-Tuned)":
            classes = ['Normal', 'Pneumonia']
            class_name = classes[class_idx.item()] if class_idx.item() < len(classes) else "Unknown"
        else:
            # Demo Logic
            class_name = "Pneumonia Detected" if confidence.item() > 0.8 else "Normal"
        
        return {
            "prediction": class_name,
            "confidence": confidence.item(),
            "details": f"Model: {IMAGE_MODEL_TYPE}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/risk")
def predict_risk(data: RiskInput):
    try:
        input_df = pd.DataFrame([{
            'age': data.age,
            'bmi': data.bmi,
            'sys_bp': data.sys_bp,
            'dia_bp': data.dia_bp,
            'glucose': data.glucose,
            'cholesterol': data.cholesterol,
            'smoker': data.smoker
        }])
        
        # Predict probability of Class 1 (High Risk)
        risk_prob = risk_model.predict_proba(input_df)[0][1]
        
        risk_level = "Low"
        if risk_prob > 0.7:
            risk_level = "High"
        elif risk_prob > 0.4:
            risk_level = "Medium"
            
        return {
            "risk_score": float(risk_prob),
            "risk_level": risk_level,
            "recommendation": generate_recommendation(risk_level, data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_recommendation(risk_level, data):
    recs = []
    if data.smoker == 1:
        recs.append("Cessation of smoking is accurate advised.")
    if data.bmi > 25:
        recs.append("Weight management program recommended.")
    if data.sys_bp > 130:
        recs.append("Monitor blood pressure regularily.")
        
    if risk_level == "High":
        recs.insert(0, "IMMEDIATE CONSULTATION REQUIRED with a cardiologist.")
    elif risk_level == "Medium":
        recs.insert(0, "Schedule a check-up within the next month.")
        
    return recs if recs else ["Maintain current healthy lifestyle."]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
