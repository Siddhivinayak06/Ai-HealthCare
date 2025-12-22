from fastapi import APIRouter, HTTPException, BackgroundTasks
import os
import shutil
import argparse
from src.schemas.models import FeedbackRequest, RetrainRequest
from src.config import DATA_DIR
from src.core.state import MODELS, training_lock
from src.model_factory import load_model_from_disk
from src.services.model_manager import load_all_models
import train

router = APIRouter(tags=["training"])

@router.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    try:
        upload_dir = os.path.join(DATA_DIR, "uploads", feedback.scan_type)
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

def run_retraining(scan_type: str, epochs: int):
    with training_lock:
        print(f"🔄 Starting background training for {scan_type}...")
        args = argparse.Namespace(
            modality=scan_type,
            epochs=epochs,
            batch_size=8,
            lr=0.001,
            model='densenet', # Default
            finetune=False
        )
        try:
            new_paths = train.train_model(args)
            if new_paths:
                print(f"✅ Retraining complete. Reloading models...")
                if isinstance(new_paths, list):
                    load_all_models()
                else:
                    model, success = load_model_from_disk(new_paths)
                    if success: MODELS[scan_type] = model
        except Exception as e:
            print(f"❌ Training error: {e}")

@router.post("/retrain")
async def trigger_retraining(request: RetrainRequest, background_tasks: BackgroundTasks):
    if training_lock.locked():
        raise HTTPException(status_code=409, detail="Training already in progress")
    
    background_tasks.add_task(run_retraining, request.scan_type, request.epochs)
    return {"message": f"Retraining started for {request.scan_type}."}
