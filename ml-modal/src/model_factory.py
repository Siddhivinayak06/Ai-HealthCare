import torch
import torch.nn as nn
from torchvision import models
import os
from .config import DEVICE

def create_model(model_name="densenet", num_classes=2, pretrained=True, freeze_backbone=True):
    """
    Creates a model with a specified backbone.
    Supported: 'densenet', 'resnet', 'efficientnet', 'efficientnet_v2', 'convnext'
    """
    if model_name == "resnet":
        weights = models.ResNet50_Weights.DEFAULT if pretrained else None
        model = models.resnet50(weights=weights)
        num_ftrs = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        backbone_params = list(model.parameters())[:-4]

    elif model_name == "efficientnet":
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        num_ftrs = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(num_ftrs, num_classes),
        )
        backbone_params = list(model.parameters())[:-2]

    elif model_name == "efficientnet_v2":
        weights = models.EfficientNet_V2_S_Weights.DEFAULT if pretrained else None
        model = models.efficientnet_v2_s(weights=weights)
        num_ftrs = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )
        backbone_params = list(model.parameters())[:-4]

    elif model_name == "convnext":
        weights = models.ConvNeXt_Tiny_Weights.DEFAULT if pretrained else None
        model = models.convnext_tiny(weights=weights)
        num_ftrs = model.classifier[2].in_features
        model.classifier = nn.Sequential(
            nn.Flatten(1),              # ConvNeXt uses LayerNorm + Flatten
            nn.LayerNorm(num_ftrs),
            nn.Linear(num_ftrs, 512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes),
        )
        backbone_params = list(model.parameters())[:-4]

    else:  # Default to densenet
        weights = models.DenseNet121_Weights.DEFAULT if pretrained else None
        model = models.densenet121(weights=weights)
        num_ftrs = model.classifier.in_features
        model.classifier = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        backbone_params = list(model.parameters())[:-4]

    if freeze_backbone:
        for param in backbone_params:
            param.requires_grad = False
    
    return model

def create_densenet_model(num_classes=2):
    """Legacy wrapper for compatibility"""
    return create_model("densenet", num_classes)

def load_model_from_disk(path: str, num_classes=2, model_name="densenet"):
    """Safely loads a model from disk, handling architecture variations"""
    try:
        model = create_model(model_name, num_classes)
        
        if os.path.exists(path):
            state_dict = torch.load(path, map_location=DEVICE)
            
            # Legacy check for DenseNet specifically
            if model_name == "densenet":
                if 'classifier.weight' in state_dict and not 'classifier.0.weight' in state_dict:
                     model.classifier = nn.Linear(model.classifier[0].in_features, num_classes)
            
            model.load_state_dict(state_dict, strict=False)
            model = model.to(DEVICE)
            model.eval()
            print(f"✅ Loaded {model_name} model from {path}")
            return model, True
        else:
            return None, False
            
    except Exception as e:
        print(f"⚠️ Error loading model from {path}: {e}")
        return None, False

def get_fallback_model(model_name="densenet"):
    """Returns a generic pre-trained model"""
    model = create_model(model_name, num_classes=2, pretrained=True, freeze_backbone=False)
    model = model.to(DEVICE)
    model.eval()
    return model

def save_model(model, path):
    torch.save(model.state_dict(), path)
    print(f"💾 Model saved to {path}")

def unfreeze_backbone(model):
    """Unfreezes all model parameters for full fine-tuning."""
    unfrozen = 0
    for param in model.parameters():
        if not param.requires_grad:
            param.requires_grad = True
            unfrozen += 1
    print(f"🔓 Unfroze {unfrozen} parameter groups for fine-tuning")
