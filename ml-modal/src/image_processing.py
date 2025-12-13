import numpy as np
import torch
from torchvision import transforms
from PIL import Image
from .config import SCAN_CONDITIONS

# Preprocessing transforms
image_preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def analyze_image_features(image: Image.Image) -> dict:
    """Analyze image features for real-time diagnosis support"""
    # Convert to grayscale for feature extraction
    img_array = np.array(image.convert('L'))
    
    mean_intensity = np.mean(img_array)
    std_intensity = np.std(img_array)
    
    # Simple edge detection approximation
    sobel_x = np.abs(np.diff(img_array, axis=1)).mean()
    sobel_y = np.abs(np.diff(img_array, axis=0)).mean()
    edge_intensity = (sobel_x + sobel_y) / 2
    
    # Entropy
    hist, _ = np.histogram(img_array.flatten(), bins=256, range=(0, 256))
    hist_normalized = hist / hist.sum()
    # Mask zero probabilities to avoid log(0)
    p = hist_normalized[hist_normalized > 0]
    entropy = -np.sum(p * np.log2(p)) if len(p) > 0 else 0
    
    contrast = float(img_array.max() - img_array.min())
    dark_ratio = np.sum(img_array < 50) / img_array.size
    bright_ratio = np.sum(img_array > 200) / img_array.size
    
    return {
        "mean_intensity": float(mean_intensity),
        "std_intensity": float(std_intensity),
        "edge_intensity": float(edge_intensity),
        "entropy": float(entropy),
        "contrast": contrast,
        "dark_ratio": float(dark_ratio),
        "bright_ratio": float(bright_ratio)
    }

def get_diagnosis_from_prediction(
    probs: torch.Tensor, 
    image_features: dict, 
    scan_type: str, 
    processing_time: float,
    is_trained: bool
) -> dict:
    """
    Combines model probabilities and image features to generate a rich diagnosis.
    """
    config = SCAN_CONDITIONS.get(scan_type, SCAN_CONDITIONS["xray"])
    labels = config.get("labels", ["Normal", "Abnormal"])
    
    prob_values = probs.cpu().numpy()
    
    # Determine Probability of Abnormality
    # We assume binary classification (Normal, Abnormal) usually index 0, 1 depending on alphabetic sort in ImageFolder
    # WARNING: ImageFolder sorts alphabetically. 
    # X-Ray: Normal, Pneumonia -> [0]=Normal, [1]=Pneumonia
    # CT: Normal, Tumor -> [0]=Normal, [1]=Tumor
    # MRI: Brain_Tumor, Normal -> [0]=Brain_Tumor, [1]=Normal  <-- WATCH OUT
    
    # To handle this robustly without metadata file, we need to know class index mapping.
    # In config, we listed labels:
    # xray: [Normal, Pneumonia] -> Alpha sorted: Normal, Pneumonia
    # ct: [Normal, Tumor] -> Alpha sorted: Normal, Tumor
    # mri: [Brain_Tumor, Normal] -> Alpha sorted: Brain_Tumor, Normal
    
    # So for MRI, index 0 is Tumor, index 1 is Normal.
    # For others, index 0 is Normal, index 1 is Abnormal.
    
    if scan_type == "mri":
        # Index 0 is Abnormal (Tumor), Index 1 is Normal
        abnormal_prob = float(prob_values[0])
        normal_prob = float(prob_values[1])
        prediction_idx = 0 if abnormal_prob > normal_prob else 1
        predicted_label = "Brain Tumor" if prediction_idx == 0 else "Normal"
    else:
        # Index 0 is Normal, Index 1 is Abnormal
        normal_prob = float(prob_values[0])
        abnormal_prob = float(prob_values[1])
        prediction_idx = 1 if abnormal_prob > normal_prob else 0
        predicted_label = labels[1] if prediction_idx == 1 else labels[0]

    # Heuristic adjustment if model is not trained (fallback)
    if not is_trained:
         # Simplified heuristic
         feature_score = (
            image_features["entropy"] / 8 * 0.3 +
            image_features["edge_intensity"] / 50 * 0.2 +
            image_features["dark_ratio"] * 0.2
         )
         feature_score = min(max(feature_score, 0), 1)
         # Blend
         abnormal_prob = (abnormal_prob + feature_score) / 2
         normal_prob = 1 - abnormal_prob
         if abnormal_prob > 0.5:
             predicted_label = labels[1] if scan_type != "mri" else labels[0]
         else:
             predicted_label = labels[0] if scan_type != "mri" else labels[1]

    # Severity and Findings Logic
    findings = []
    severity = "Normal"
    
    if "Normal" in predicted_label:
        severity = "Normal"
        findings.append("No significant abnormalities identified")
        findings.append(f"Image quality check: {'Pass' if image_features['contrast']>50 else 'Low Contrast'}")
    else:
        # It's abnormal
        if abnormal_prob > 0.9:
            severity = "Critical"
            findings.append("🚨 High confidence abnormality detected")
        elif abnormal_prob > 0.7:
             severity = "High"
             findings.append("Significant findings detected")
        elif abnormal_prob > 0.5:
             severity = "Medium"
             findings.append("Moderate probability of abnormality")
        else:
             severity = "Low" # Should rarely happen if label says abnormal
             
        findings.append(f"Confidence: {abnormal_prob*100:.1f}%")
        findings.append(f"Entropy Score: {image_features['entropy']:.2f}")

    return {
        "prediction": predicted_label,
        "severity": severity,
        "findings": findings,
        "confidence": max(normal_prob, abnormal_prob),
        "probabilities": {
            "normal": round(normal_prob, 4),
            "abnormal": round(abnormal_prob, 4)
        },
        "image_analysis": {
            k: round(v, 2) for k, v in image_features.items()
        }
    }
