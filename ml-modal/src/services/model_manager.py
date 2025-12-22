import os
import torch
from src.config import SCAN_CONDITIONS, MODEL_FILES, MODALITY_MODEL_PATH, GENERIC_MODEL_FILENAME, DEVICE
from src.model_factory import load_model_from_disk, get_fallback_model
from src.core.state import MODELS, training_lock

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
        
        # 1. Handle "modality_check" special case
        if model_key == "modality_check":
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

def load_all_models():
    """Reloads all known models from disk (Avoid calling at startup!)"""
    print("⚠️ Warning: Loading ALL models at once. High memory usage possible.")
    keys = list(MODEL_FILES.keys()) + ["modality_check"]
    for k in keys:
        get_model_lazy(k)
