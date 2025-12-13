import torch
import torch.nn as nn
from torchvision import models
import os
from .config import DEVICE

def create_densenet_model(num_classes=2):
    """Creates specific DenseNet121 architecture used for this project"""
    model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    
    # Freeze backbone
    for param in model.parameters():
        param.requires_grad = False
        
    num_ftrs = model.classifier.in_features
    
    # Custom classifier head
    model.classifier = nn.Sequential(
        nn.Linear(num_ftrs, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes)
    )
    return model

def load_model_from_disk(path: str, num_classes=2):
    """Safely loads a model from disk, handling architecture variations"""
    try:
        model = create_densenet_model(num_classes)
        
        if os.path.exists(path):
            state_dict = torch.load(path, map_location=DEVICE)
            
            # Check for architecture mismatch (Legacy vs New)
            # Legacy simple linear vs New Sequential
            # If current wrapper is Sequential but state_dict keys look like 'classifier.weight' (Linear)
            if 'classifier.weight' in state_dict and not 'classifier.0.weight' in state_dict:
                 # Revert to simple linear for legacy loading
                 model.classifier = nn.Linear(model.classifier[0].in_features, num_classes)
            
            model.load_state_dict(state_dict, strict=False)
            model = model.to(DEVICE)
            model.eval()
            print(f"✅ Loaded model from {path}")
            return model, True
        else:
            return None, False
            
    except Exception as e:
        print(f"⚠️ Error loading model from {path}: {e}")
        return None, False

def get_fallback_model():
    """Returns a generic pre-trained DenseNet"""
    model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    model = model.to(DEVICE)
    model.eval()
    return model

def save_model(model, path):
    torch.save(model.state_dict(), path)
    print(f"💾 Model saved to {path}")
