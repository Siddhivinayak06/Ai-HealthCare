from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from PIL import Image
import torch
import io
import os
import shutil
import uuid
import time
import argparse
from typing import Optional, Dict
from threading import Lock

# Functional Modules
import train
from src.config import SCAN_CONDITIONS, MODEL_FILES, DATA_DIR, GENERIC_MODEL_FILENAME, DEVICE
from src.model_factory import load_model_from_disk, get_fallback_model
from src.image_processing import analyze_image_features, get_diagnosis_from_prediction, image_preprocess
from src.risk import get_risk_model, predict_patient_risk

app = FastAPI(
    title="MedAI Diagnostics API",
    description="AI-powered medical imaging analysis with Continuous Learning",
    version="3.0.0"
)

# --- STATE ---
MODELS: Dict[str, torch.nn.Module] = {}
training_lock = Lock()
risk_model = get_risk_model()


# --- INITIALIZATION & LAZY LOADING ---
def get_model_lazy(model_key: str):
    """
    Retrieves a model from the global cache, loading it from disk if not present.
    """
    if model_key in MODELS:
        return MODELS[model_key]

    with training_lock:
        # Double-check pattern
        if model_key in MODELS:
             return MODELS[model_key]

        print(f"🔄 Lazy loading model: {model_key}...")
        
        # 1. Handle "modality_check" speical case
        if model_key == "modality_check":
            from src.config import MODALITY_MODEL_PATH
            if os.path.exists(MODALITY_MODEL_PATH):
                mod_model, success = load_model_from_disk(MODALITY_MODEL_PATH, num_classes=3)
                if success:
                    MODELS["modality_check"] = mod_model
                    print("✅ Loaded Auto-Modality Detector")
                    return mod_model
            return None

        # 2. Handle specific imaging models
        if model_key in MODEL_FILES:
            filename = MODEL_FILES[model_key]
            model, success = load_model_from_disk(filename)
            if success:
                MODELS[model_key] = model
                return model
        
        # 3. Fallbacks
        if model_key == "xray" and os.path.exists(GENERIC_MODEL_FILENAME):
            print(f"ℹ️ Using generic legacy model for {model_key}")
            model, _ = load_model_from_disk(GENERIC_MODEL_FILENAME)
            MODELS["xray"] = model
            return model
        
        # 4. Untrained fallback
        if model_key in SCAN_CONDITIONS: # Only return fallback for known types
            print(f"ℹ️ Using generic backbone for {model_key} (Untrained)")
            model = get_fallback_model()
            MODELS[model_key] = model
            return model

        return None

# Deprecated but kept for compatibility with retrain logic if needed, 
# though retrain should ideally reload just one.
def load_all_models():
    """Reloads all known models from disk (Avoid calling at startup!)"""
    print("⚠️ Warning: Loading ALL models at once. High memory usage possible.")
    keys = list(MODEL_FILES.keys()) + ["modality_check"]
    for k in keys:
        get_model_lazy(k)

# REMOVED: load_all_models() call at startup to fix OOM 137

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {
        "status": "Active",
        "version": "3.0.0",
        "loaded_models_in_memory": list(MODELS.keys()),
        "device": str(DEVICE)
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time(), "device": str(DEVICE)}

@app.get("/scan-types")
def get_scan_types():
    return SCAN_CONDITIONS

@app.post("/predict/image")
async def predict_image(
    file: UploadFile = File(...),
    scan_type: Optional[str] = Form(default="xray")
):
    scan_type = scan_type.lower() if scan_type else "xray"
    if scan_type not in SCAN_CONDITIONS: scan_type = "xray"
    
    start_time = time.time()
    
    try:
        # 1. Read and Process Image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # 2. Save for Continuous Learning
        image_id = str(uuid.uuid4())
        upload_dir = os.path.join(DATA_DIR, "uploads", scan_type)
        os.makedirs(upload_dir, exist_ok=True)
        image_path = os.path.join(upload_dir, f"{image_id}.png")
        image.save(image_path)
        
        # 3. Analyze Features (Real-time)
        image_features = analyze_image_features(image)
        
        # --- AUTO-MODALITY CHECK ---
        modality_model = get_model_lazy("modality_check")
        input_tensor = image_preprocess(image).unsqueeze(0).to(DEVICE)
        
        detected_scan_type = scan_type # Default to user request
        auto_corrected = False
        modality_debug = {}
        
        if modality_model:
            try:
                with torch.no_grad():
                    mod_output = modality_model(input_tensor)
                    mod_probs = torch.nn.functional.softmax(mod_output[0], dim=0)
                    mod_conf, mod_pred_idx = torch.max(mod_probs, 0)
                    
                    # Mapping based on alphabetical order of folders: ct, mri, xray
                    mod_classes = ["ct", "mri", "xray"]
                    
                    # Store basic debug info without verbose printing
                    modality_debug = {
                        "detected": mod_classes[mod_pred_idx.item()] if mod_pred_idx < 3 else "unknown",
                        "confidence": float(mod_conf.item()),
                        "requested": scan_type
                    }

                    if mod_pred_idx < len(mod_classes):
                        detected_modality = mod_classes[mod_pred_idx.item()]
                        
                        # Lower threshold to 0.7 and ensure we don't correct if it matches
                        if detected_modality != scan_type and mod_conf.item() > 0.7:
                            print(f"⚠️ Auto-Correction: {scan_type} -> {detected_modality}")
                            detected_scan_type = detected_modality
                            auto_corrected = True
            except Exception as e:
                print(f"⚠️ Modality check failed: {e}")
                modality_debug["error"] = str(e)
        
        # 4. Model Inference (Use detected type)
        final_scan_type = detected_scan_type
        model = get_model_lazy(final_scan_type)
        is_trained = (final_scan_type in MODELS and 
                     (os.path.exists(MODEL_FILES.get(final_scan_type, "")) or 
                      (final_scan_type=="xray" and os.path.exists(GENERIC_MODEL_FILENAME))))
        
        with torch.no_grad():
            output = model(input_tensor)
            probs = torch.nn.functional.softmax(output[0], dim=0)
            
        processing_time = time.time() - start_time
        
        # 5. Generate Diagnosis
        diagnosis = get_diagnosis_from_prediction(
            probs, image_features, final_scan_type, processing_time, is_trained
        )
        
        # Add auto-correction info
        diagnosis["modality_debug"] = modality_debug
        if auto_corrected:
            diagnosis["findings"].insert(0, f"⚠️ Note: Auto-detected as {SCAN_CONDITIONS[final_scan_type]['name']} instead of {SCAN_CONDITIONS[scan_type]['name']}")
            diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]['name'] # Update displayed type
            diagnosis["auto_corrected"] = True
        
        # 6. Generate Recommendations (Simple heuristic moved here or kept in src? 
        # For now, simplistic generation based on severity)
        recs = []
        if diagnosis['severity'] in ['High', 'Critical']:
            recs.append("Urgent specialist consultation required")
        elif diagnosis['severity'] == 'Medium':
            recs.append("Follow-up imaging recommended")
        else:
            recs.append("No specific medical intervention required")
            
        diagnosis["recommendations"] = recs
        diagnosis["id"] = image_id
        # Use final_scan_type to ensure frontend sees the corrected modality
        diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]["name"]
        
        return diagnosis

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class FeedbackRequest(BaseModel):
    image_id: str
    scan_type: str
    correct_label: str

@app.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    try:
        upload_dir = os.path.join(DATA_DIR, "uploads", feedback.scan_type)
        # Assuming label matches folder name exactly
        train_dir = os.path.join(DATA_DIR, feedback.scan_type, "train", feedback.correct_label)
        os.makedirs(train_dir, exist_ok=True)
        
        filename = f"{feedback.image_id}.png"
        src_path = os.path.join(upload_dir, filename)
        dst_path = os.path.join(train_dir, filename)
        
        if not os.path.exists(src_path):
            raise HTTPException(status_code=404, detail="Image not found in uploads")
            
        shutil.move(src_path, dst_path)
        
        return {"message": "Feedback received. Image added to training dataset."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RetrainRequest(BaseModel):
    scan_type: str
    epochs: int = 5

def run_retraining(scan_type: str, epochs: int):
    with training_lock:
        print(f"🔄 Starting background training for {scan_type}...")
        # Create args object expected by train_model
        args = argparse.Namespace(
            modality=scan_type,
            epochs=epochs,
            batch_size=8,
            lr=0.001
        )
        try:
            # train.train_model returns path(s)
            new_paths = train.train_model(args)
            
            if new_paths:
                print(f"✅ Retraining complete. Reloading models...")
                # Reload specific model
                if isinstance(new_paths, list):
                    load_all_models()
                else:
                    # Single model reload
                    model, success = load_model_from_disk(new_paths)
                    if success: MODELS[scan_type] = model
        except Exception as e:
            print(f"❌ Training error: {e}")

@app.post("/retrain")
async def trigger_retraining(request: RetrainRequest, background_tasks: BackgroundTasks):
    if training_lock.locked():
        raise HTTPException(status_code=409, detail="Training already in progress")
    
    background_tasks.add_task(run_retraining, request.scan_type, request.epochs)
    return {"message": f"Retraining started for {request.scan_type}."}


class RiskInput(BaseModel):
    age: int; bmi: float; sys_bp: int; dia_bp: int; glucose: int; cholesterol: int; smoker: int

@app.post("/predict/risk")
def predict_risk_endpoint(data: RiskInput):
    try:
        return predict_patient_risk(risk_model, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
