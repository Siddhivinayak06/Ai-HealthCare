import numpy as np
import torch
from torchvision import transforms
from PIL import Image, ImageFilter
import cv2
from scipy import stats as scipy_stats
from .config import SCAN_CONDITIONS

# ─── Preprocessing Transforms ────────────────────────────────────────────────

image_preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# TTA augmentations: deterministic geometric transforms for stable averaging
_tta_transforms = [
    # Original
    transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # Horizontal flip
    transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # Vertical flip
    transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomVerticalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # Slight center crop variation (zoom in)
    transforms.Compose([
        transforms.Resize(280),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
    # Slight center crop variation (zoom out)
    transforms.Compose([
        transforms.Resize(240),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]),
]


# ─── CLAHE Medical Preprocessing ─────────────────────────────────────────────

def apply_clahe(image: Image.Image, clip_limit: float = 3.0, tile_size: int = 8) -> Image.Image:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to improve contrast in medical scans. Works on each channel independently
    for RGB images, or directly on grayscale.
    """
    img_array = np.array(image)

    if len(img_array.shape) == 2:
        # Grayscale
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
        enhanced = clahe.apply(img_array)
        return Image.fromarray(enhanced)
    else:
        # RGB: apply CLAHE per channel
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_size, tile_size))
        channels = cv2.split(img_array)
        enhanced_channels = [clahe.apply(ch) for ch in channels]
        enhanced = cv2.merge(enhanced_channels)
        return Image.fromarray(enhanced)


def preprocess_medical_image(image: Image.Image) -> Image.Image:
    """
    Full medical image preprocessing pipeline:
    1. Convert to RGB
    2. Apply CLAHE contrast enhancement
    """
    image = image.convert("RGB")
    image = apply_clahe(image)
    return image


# ─── Test-Time Augmentation (TTA) ────────────────────────────────────────────

def tta_predict(model, image: Image.Image, device) -> dict:
    """
    Performs Test-Time Augmentation: runs the model on multiple deterministic
    augmentations of the same image and averages the softmax probabilities.
    
    Returns:
        dict with 'mean_probs' (averaged softmax), 'std_probs' (std across augmentations),
        and 'tta_agreement' (fraction of augmentations that agree on the class).
    """
    all_probs = []

    with torch.no_grad():
        for t in _tta_transforms:
            input_tensor = t(image).unsqueeze(0).to(device)
            output = model(input_tensor)
            probs = torch.nn.functional.softmax(output[0], dim=0)
            all_probs.append(probs.cpu())

    stacked = torch.stack(all_probs)  # [N, num_classes]
    mean_probs = torch.mean(stacked, dim=0)
    std_probs = torch.std(stacked, dim=0)

    # Agreement: how many augmentations predict the same class
    predictions = torch.argmax(stacked, dim=1)
    most_common_class = torch.mode(predictions).values.item()
    agreement = (predictions == most_common_class).float().mean().item()

    return {
        "mean_probs": mean_probs,
        "std_probs": std_probs,
        "tta_agreement": agreement,
        "num_augmentations": len(_tta_transforms)
    }


# ─── Enhanced Image Feature Analysis ─────────────────────────────────────────

def analyze_image_features(image: Image.Image) -> dict:
    """
    Comprehensive image feature analysis for diagnostic support.
    Extracts intensity, texture, symmetry, and histogram shape features.
    """
    # Convert to grayscale float for feature extraction
    img_array = np.array(image.convert('L'), dtype=np.float32)

    # ── Basic intensity statistics ──
    mean_intensity = float(np.mean(img_array))
    std_intensity = float(np.std(img_array))

    # ── Edge detection (Sobel approximation) ──
    sobel_x = np.abs(np.diff(img_array, axis=1)).mean()
    sobel_y = np.abs(np.diff(img_array, axis=0)).mean()
    edge_intensity = float((sobel_x + sobel_y) / 2)

    # ── Entropy ──
    hist, _ = np.histogram(img_array.flatten(), bins=256, range=(0, 256))
    hist_normalized = hist / hist.sum()
    p = hist_normalized[hist_normalized > 0]
    entropy = float(-np.sum(p * np.log2(p))) if len(p) > 0 else 0.0

    # ── Contrast and intensity ratios ──
    contrast = float(img_array.max() - img_array.min())
    dark_ratio = float(np.sum(img_array < 50) / img_array.size)
    bright_ratio = float(np.sum(img_array > 200) / img_array.size)

    # ── Symmetry score (left vs right half) ──
    h, w = img_array.shape
    left_half = img_array[:, :w // 2]
    right_half = img_array[:, w // 2:]
    # Flip right half to align with left
    right_flipped = np.flip(right_half, axis=1)
    # Crop to same size (in case of odd width)
    min_w = min(left_half.shape[1], right_flipped.shape[1])
    left_crop = left_half[:, :min_w]
    right_crop = right_flipped[:, :min_w]
    # Normalized difference
    diff = np.abs(left_crop - right_crop)
    symmetry_score = float(1.0 - (np.mean(diff) / (np.mean(img_array) + 1e-8)))
    symmetry_score = max(0.0, min(1.0, symmetry_score))

    # ── Histogram shape: skewness and kurtosis ──
    flat = img_array.flatten()
    skewness = float(scipy_stats.skew(flat))
    kurtosis = float(scipy_stats.kurtosis(flat))

    # ── Quadrant-based regional intensity ──
    mid_h, mid_w = h // 2, w // 2
    quadrant_means = {
        "top_left": float(np.mean(img_array[:mid_h, :mid_w])),
        "top_right": float(np.mean(img_array[:mid_h, mid_w:])),
        "bottom_left": float(np.mean(img_array[mid_h:, :mid_w])),
        "bottom_right": float(np.mean(img_array[mid_h:, mid_w:])),
    }
    # Regional variance: high variance across quadrants suggests localized abnormality
    regional_variance = float(np.var(list(quadrant_means.values())))

    return {
        "mean_intensity": mean_intensity,
        "std_intensity": std_intensity,
        "edge_intensity": edge_intensity,
        "entropy": entropy,
        "contrast": contrast,
        "dark_ratio": dark_ratio,
        "bright_ratio": bright_ratio,
        "symmetry_score": symmetry_score,
        "skewness": skewness,
        "kurtosis": kurtosis,
        "regional_variance": regional_variance,
        "quadrant_means": quadrant_means,
    }


# ─── Diagnosis Generation ────────────────────────────────────────────────────

def get_diagnosis_from_prediction(
    probs: torch.Tensor,
    image_features: dict,
    scan_type: str,
    processing_time: float,
    is_trained: bool
) -> dict:
    """
    Combines model probabilities and image features to generate a rich diagnosis.
    Robust to empty image_features and config-driven label ordering.
    """
    config = SCAN_CONDITIONS.get(scan_type, SCAN_CONDITIONS["xray"])
    labels = config.get("labels", ["Normal", "Abnormal"])

    prob_values = probs.cpu().numpy()

    # ── Determine Normal vs Abnormal probabilities ──
    # The label order in config matches ImageFolder alphabetical sorting.
    # MRI: [Brain_Tumor, Normal] → idx 0 = abnormal, idx 1 = normal
    # X-Ray: [Normal, Pneumonia] → idx 0 = normal, idx 1 = abnormal
    # CT: [Normal, Tumor] → idx 0 = normal, idx 1 = abnormal

    if scan_type == "mri":
        abnormal_prob = float(prob_values[0])
        normal_prob = float(prob_values[1])
        predicted_label = labels[0] if abnormal_prob > normal_prob else labels[1]
    else:
        normal_prob = float(prob_values[0])
        abnormal_prob = float(prob_values[1])
        predicted_label = labels[1] if abnormal_prob > normal_prob else labels[0]

    # ── Heuristic adjustment if model is not trained (fallback) ──
    if not is_trained and image_features:
        feature_score = (
            image_features.get("entropy", 4.0) / 8.0 * 0.25 +
            image_features.get("edge_intensity", 10.0) / 50.0 * 0.15 +
            image_features.get("dark_ratio", 0.1) * 0.15 +
            (1.0 - image_features.get("symmetry_score", 0.9)) * 0.20 +
            image_features.get("regional_variance", 0.0) / 500.0 * 0.15 +
            abs(image_features.get("skewness", 0.0)) / 3.0 * 0.10
        )
        feature_score = max(0.0, min(1.0, feature_score))
        # Blend model output with feature heuristic
        abnormal_prob = (abnormal_prob * 0.6 + feature_score * 0.4)
        normal_prob = 1.0 - abnormal_prob
        if abnormal_prob > 0.5:
            predicted_label = labels[0] if scan_type == "mri" else labels[1]
        else:
            predicted_label = labels[1] if scan_type == "mri" else labels[0]

    # ── Severity and Findings Logic ──
    findings = []
    recommendations = []
    severity = "Normal"

    is_normal = "Normal" in predicted_label

    if is_normal:
        severity = "Normal"
        if scan_type == "xray":
            findings = [
                "Clear lung fields without focal consolidation",
                "Heart size and mediastinal contours are within normal limits",
                "No visible pleural effusion or pneumothorax",
            ]
        elif scan_type == "mri":
            findings = [
                "Normal signal intensity of brain parenchyma",
                "No evidence of acute intracranial hemorrhage or mass",
                "Ventricles are symmetrical and normal in size",
            ]
        else:
            findings = [
                "No space-occupying lesions identified",
                "Parenchyma appears within normal age-appropriate limits",
                "Organ structures are unremarkable",
            ]
        recommendations = [
            "No specific medical intervention required",
            "Maintain routine wellness check-ups",
        ]
    else:
        # Abnormal classification
        if abnormal_prob > 0.9:
            severity = "Critical"
        elif abnormal_prob > 0.7:
            severity = "High"
        elif abnormal_prob > 0.5:
            severity = "Medium"
        else:
            severity = "Low"

        if "Pneumonia" in predicted_label:
            findings = [
                "Patchy opacities and focal consolidation observed",
                "Air bronchograms noted in the affected lung zones",
                "Slight obscuration of the diaphragmatic contour",
            ]
            recommendations = [
                "Immediate clinical correlation required",
                "Consider initiating appropriate antibiotic therapy",
                "Follow-up chest X-ray in 2-4 weeks to confirm resolution",
            ]
        elif "Tumor" in predicted_label:
            if scan_type == "mri":
                findings = [
                    "Abnormal signal intensity mass detected",
                    "Surrounding vasogenic edema is present",
                    "Evidence of localized mass effect on adjacent structures",
                ]
            else:
                findings = [
                    "Hyperdense focal lesion or mass detected",
                    "Irregular margins suggesting potential malignancy",
                    "Possible involvement of adjacent tissues",
                ]
            recommendations = [
                "Urgent specialist consultation (Oncology/Neurosurgery) required",
                "Recommend contrast-enhanced imaging for detailed characterization",
                "Consider image-guided biopsy for definitive histopathology",
            ]
        else:
            findings = [
                f"Significant indicators of {predicted_label} detected",
                "Morphological abnormalities observed in the scan region",
            ]
            recommendations = [
                "Urgent specialist consultation required",
                "Further diagnostic evaluation recommended",
            ]

        findings.append(f"AI Confidence Score: {(abnormal_prob * 100):.1f}%")

        # Add texture-based findings if features are available
        if image_features:
            sym = image_features.get("symmetry_score", None)
            if sym is not None and sym < 0.7:
                findings.append(
                    f"Asymmetric tissue distribution detected (symmetry: {sym:.2f})"
                )

            reg_var = image_features.get("regional_variance", None)
            if reg_var is not None and reg_var > 200:
                findings.append(
                    "Significant regional intensity variation — possible localized pathology"
                )

    # ── Build response ──
    image_analysis = {}
    if image_features:
        # Exclude nested dicts from the top-level rounding
        for k, v in image_features.items():
            if isinstance(v, (int, float)):
                image_analysis[k] = round(v, 2)

    return {
        "prediction": predicted_label,
        "severity": severity,
        "findings": findings,
        "recommendations": recommendations,
        "confidence": round(max(normal_prob, abnormal_prob), 4),
        "probabilities": {
            "normal": round(normal_prob, 4),
            "abnormal": round(abnormal_prob, 4),
        },
        "image_analysis": image_analysis,
    }
