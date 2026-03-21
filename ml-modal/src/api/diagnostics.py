from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from PIL import Image
import torch
import io
import os
import uuid
import time
from typing import Optional
from src.config import SCAN_CONDITIONS, MODEL_FILES, DATA_DIR, DEVICE
from src.services.model_manager import get_model_lazy
from src.image_processing import (
    analyze_image_features,
    get_diagnosis_from_prediction,
    image_preprocess,
    preprocess_medical_image,
    tta_predict,
)
from src.explainability.explanation import UnifiedExplainer
from src.api.auth import verify_token

router = APIRouter(prefix="/predict", tags=["diagnostics"], dependencies=[Depends(verify_token)])

@router.post("/image")
async def predict_image(
    file: UploadFile = File(...),
    scan_type: Optional[str] = Form(default="xray"),
    explain: bool = Form(default=False)
):
    scan_type = scan_type.lower() if scan_type else "xray"
    if scan_type not in SCAN_CONDITIONS: scan_type = "xray"
    
    start_time = time.time()
    
    try:
        contents = await file.read()
        raw_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        image_id = str(uuid.uuid4())
        upload_dir = os.path.join(DATA_DIR, "uploads", scan_type)
        os.makedirs(upload_dir, exist_ok=True)
        image_path = os.path.join(upload_dir, f"{image_id}.png")
        raw_image.save(image_path)
        
        # ── Step 1: Medical-grade preprocessing (CLAHE) ──
        enhanced_image = preprocess_medical_image(raw_image)
        
        # ── Step 2: Extract rich image features ──
        image_features = analyze_image_features(enhanced_image)
        
        # ── Step 3: Auto-detect modality ──
        modality_model = get_model_lazy("modality_check")
        input_tensor = image_preprocess(enhanced_image).unsqueeze(0).to(DEVICE)
        
        detected_scan_type = scan_type
        auto_corrected = False
        modality_debug = {}
        
        if modality_model:
            try:
                with torch.no_grad():
                    mod_output = modality_model(input_tensor)
                    mod_probs = torch.nn.functional.softmax(mod_output[0], dim=0)
                    mod_conf, mod_pred_idx = torch.max(mod_probs, 0)
                    mod_classes = ["ct", "mri", "xray"]
                    
                    modality_debug = {
                        "detected": mod_classes[mod_pred_idx.item()] if mod_pred_idx < 3 else "unknown",
                        "confidence": float(mod_conf.item()),
                        "requested": scan_type
                    }

                    if mod_pred_idx < len(mod_classes):
                        detected_modality = mod_classes[mod_pred_idx.item()]
                        if detected_modality != scan_type and mod_conf.item() > 0.7:
                            detected_scan_type = detected_modality
                            auto_corrected = True
            except Exception as e:
                modality_debug["error"] = str(e)
        
        final_scan_type = detected_scan_type
        model = get_model_lazy(final_scan_type)
        
        # Check if the model is actually loaded and trained
        from src.core.state import MODELS
        from src.config import GENERIC_MODEL_FILENAME
        is_trained = (final_scan_type in MODELS and 
                     (os.path.exists(MODEL_FILES.get(final_scan_type, "")) or 
                      (final_scan_type=="xray" and os.path.exists(GENERIC_MODEL_FILENAME))))

        # ── Step 4: Test-Time Augmentation (TTA) for robust prediction ──
        tta_result = tta_predict(model, enhanced_image, DEVICE)
        probs = tta_result["mean_probs"]
        
        # ── Step 5: MC-Dropout confidence estimation ──
        from src.confidence.services import get_prediction_with_confidence
        conf_result = get_prediction_with_confidence(model, input_tensor)
        confidence_metrics = conf_result["confidence_metrics"]
        
        processing_time = time.time() - start_time
        
        # ── Step 6: Generate diagnosis ──
        diagnosis = get_diagnosis_from_prediction(
            probs, image_features, final_scan_type, processing_time, is_trained
        )
        
        # Enrich with TTA & confidence metadata
        diagnosis["confidence_metrics"] = confidence_metrics
        diagnosis["modality_debug"] = modality_debug
        diagnosis["processing_metadata"] = {
            "tta_agreement": round(tta_result["tta_agreement"], 4),
            "tta_augmentations": tta_result["num_augmentations"],
            "tta_std": [round(float(s), 4) for s in tta_result["std_probs"]],
            "clahe_enhanced": True,
            "processing_time_ms": round(processing_time * 1000, 1),
        }
        
        if auto_corrected:
            diagnosis["findings"].insert(0, f"⚠️ Note: Auto-detected as {SCAN_CONDITIONS[final_scan_type]['name']} instead of {SCAN_CONDITIONS[scan_type]['name']}")
            diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]['name']
            diagnosis["auto_corrected"] = True
        
        recs = diagnosis.get("recommendations", [])
        if not recs:
            if diagnosis['severity'] in ['High', 'Critical']:
                recs.append("Urgent specialist consultation required")
            elif diagnosis['severity'] == 'Medium':
                recs.append("Follow-up imaging recommended")
            else:
                recs.append("No specific medical intervention required")
            
        diagnosis["recommendations"] = recs
        diagnosis["id"] = image_id
        diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]["name"]
        
        # Frontend compatibility: ensure 'details' field exists
        if "findings" in diagnosis and diagnosis["findings"]:
            diagnosis["details"] = ". ".join(diagnosis["findings"])
        elif "recommendations" in diagnosis and diagnosis["recommendations"]:
            diagnosis["details"] = diagnosis["recommendations"][0]
        else:
            diagnosis["details"] = f"Analysis completed with {diagnosis['confidence']:.1%} confidence."
        
        if explain:
            explanation = UnifiedExplainer.explain_image(model, input_tensor, enhanced_image, image_id, DATA_DIR, diagnosis)
            if explanation:
                diagnosis["explanation_url"] = explanation["url"]
                diagnosis["explanation_text"] = explanation["summary"]
                diagnosis["explanation_details"] = explanation.get("confidence_metrics")
            else:
                diagnosis["explanation_url"] = None
                diagnosis["explanation_text"] = "XAI generation skipped or failed."
        

        return diagnosis
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def predict_batch(
    file: UploadFile = File(...),
    scan_type: Optional[str] = Form(default="ct"),
    explain: bool = Form(default=False)
):
    import zipfile
    import shutil
    import tempfile
    
    scan_type = scan_type.lower() if scan_type else "ct"
    temp_dir = tempfile.mkdtemp()
    
    try:
        contents = await file.read()
        zip_path = os.path.join(temp_dir, "batch.zip")
        with open(zip_path, "wb") as f:
            f.write(contents)
            
        extract_dir = os.path.join(temp_dir, "extracted")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        image_files = []
        for root, _, files in os.walk(extract_dir):
            for f in files:
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.dcm', '.bmp')):
                    image_files.append(os.path.join(root, f))
                    
        if not image_files:
            raise HTTPException(status_code=400, detail="No valid images found in ZIP")
            
        results = []
        model = get_model_lazy(scan_type)
        
        for img_path in image_files:
            try:
                image = Image.open(img_path).convert("RGB")
                enhanced = preprocess_medical_image(image)
                
                # Extract features for each batch image
                batch_features = analyze_image_features(enhanced)
                
                input_tensor = image_preprocess(enhanced).unsqueeze(0).to(DEVICE)
                
                with torch.no_grad():
                    output = model(input_tensor)
                    probs = torch.nn.functional.softmax(output[0], dim=0)
                    
                diag = get_diagnosis_from_prediction(probs, batch_features, scan_type, 0.1, True)
                diag["image_name"] = os.path.basename(img_path)
                
                # Risk score: Probability of non-normal class
                if scan_type == "mri":
                    risk_score = float(probs[0].item())  # idx 0 is abnormal for MRI
                else:
                    risk_score = float(probs[1].item())  # idx 1 is abnormal for others
                diag["risk_score"] = risk_score
                
                results.append(diag)
            except Exception as e:
                print(f"Error processing slice {img_path}: {e}")
                
        if not results:
            raise HTTPException(status_code=500, detail="Failed to process any images in batch")
            
        # Find the most "Critical" result
        severity_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Normal": 0}
        results.sort(key=lambda x: (severity_map.get(x["severity"], 0), x.get("risk_score", 0)), reverse=True)
        
        most_critical = results[0]
        most_critical["batch_count"] = len(results)
        most_critical["is_batch"] = True
        
        return most_critical
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
