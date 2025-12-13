import os
import torch

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = BASE_DIR

# Model Filenames
MODEL_FILES = {
    "xray": "model_xray.pth",
    "ct": "model_ct.pth",
    "mri": "model_mri.pth"
}
MODALITY_MODEL_PATH = "model_modality_check.pth"
GENERIC_MODEL_FILENAME = "medical_model.pth"

# Training Hyperparameters
DEFAULT_EPOCHS = 10
DEFAULT_BATCH_SIZE = 16
DEFAULT_LEARNING_RATE = 0.001

# Scan Types and Labels
SCAN_CONDITIONS = {
    "xray": {
        "name": "X-Ray",
        "labels": ["Normal", "Pneumonia"],
        "description": "Chest and bone radiography analysis"
    },
    "ct": {
        "name": "CT Scan",
        "labels": ["Normal", "Tumor"],
        "description": "Cross-sectional computed tomography analysis"
    },
    "mri": {
        "name": "MRI",
        "labels": ["Brain_Tumor", "Normal"], # Order matters, matched with training
        "description": "Magnetic resonance imaging analysis"
    }
}

# Device Configuration
def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda:0")
    else:
        return torch.device("cpu")

DEVICE = get_device()
