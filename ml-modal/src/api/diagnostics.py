from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from PIL import Image
import torch
import io
import os
import uuid
import time
from typing import Optional
from src.config import SCAN_CONDITIONS, MODEL_FILES, DATA_DIR, DEVICE
from src.services.model_manager import get_model_lazy
from src.image_processing import analyze_image_features, get_diagnosis_from_prediction, image_preprocess
from src.explainability.explanation import UnifiedExplainer

router = APIRouter(prefix="/predict", tags=["diagnostics"])

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
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        image_id = str(uuid.uuid4())
        upload_dir = os.path.join(DATA_DIR, "uploads", scan_type)
        os.makedirs(upload_dir, exist_ok=True)
        image_path = os.path.join(upload_dir, f"{image_id}.png")
        image.save(image_path)
        
        image_features = analyze_image_features(image)
        
        modality_model = get_model_lazy("modality_check")
        input_tensor = image_preprocess(image).unsqueeze(0).to(DEVICE)
        
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

        with torch.no_grad():
            output = model(input_tensor)
            probs = torch.nn.functional.softmax(output[0], dim=0)
            
        processing_time = time.time() - start_time
        
        diagnosis = get_diagnosis_from_prediction(
            probs, image_features, final_scan_type, processing_time, is_trained
        )
        
        diagnosis["modality_debug"] = modality_debug
        if auto_corrected:
            diagnosis["findings"].insert(0, f"⚠️ Note: Auto-detected as {SCAN_CONDITIONS[final_scan_type]['name']} instead of {SCAN_CONDITIONS[scan_type]['name']}")
            diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]['name']
            diagnosis["auto_corrected"] = True
        
        recs = []
        if diagnosis['severity'] in ['High', 'Critical']:
            recs.append("Urgent specialist consultation required")
        elif diagnosis['severity'] == 'Medium':
            recs.append("Follow-up imaging recommended")
        else:
            recs.append("No specific medical intervention required")
            
        diagnosis["recommendations"] = recs
        diagnosis["id"] = image_id
        diagnosis["scan_type"] = SCAN_CONDITIONS[final_scan_type]["name"]
        
        if explain:
            explanation = UnifiedExplainer.explain_image(model, input_tensor, image, image_id, DATA_DIR)
            if explanation:
                diagnosis["explanation_url"] = explanation["url"]
                diagnosis["explanation_text"] = explanation["summary"]
            else:
                diagnosis["explanation_url"] = None
                diagnosis["explanation_text"] = "XAI generation skipped or failed."
        
        return diagnosis

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
