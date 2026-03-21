import torch
import numpy as np

def calculate_uncertainty(mean_preds, variance_preds, predictive_entropy=None, mutual_information=None):
    """
    Calculates unified confidence and uncertainty metrics.
    Now incorporates entropy-based uncertainty for more clinically meaningful assessments.
    """
    # Confidence is the maximum probability
    confidence_scores = torch.max(mean_preds, dim=1)[0].cpu().numpy()
    
    # Variance-based uncertainty
    uncertainty_values = torch.mean(variance_preds, dim=1).cpu().numpy()
    
    # Entropy-based uncertainty (if provided)
    entropy_values = predictive_entropy.cpu().numpy() if predictive_entropy is not None else None
    mi_values = mutual_information.cpu().numpy() if mutual_information is not None else None
    
    results = []
    for i, (conf, unc) in enumerate(zip(confidence_scores, uncertainty_values)):
        # Combine variance and entropy for a more robust uncertainty level
        entropy_val = float(entropy_values[i]) if entropy_values is not None else None
        mi_val = float(mi_values[i]) if mi_values is not None else None
        
        # Determine uncertainty level using both metrics
        # Entropy-based thresholds (log2(2) = 1.0 for binary, so 0.3 and 0.6 are reasonable)
        if entropy_val is not None:
            # Combined scoring: weight both variance and entropy
            combined_score = unc * 0.4 + (entropy_val / 1.0) * 0.6  # normalize entropy
            if combined_score < 0.15:
                level = "LOW"
                review_required = False
            elif combined_score < 0.40:
                level = "MEDIUM"
                review_required = True
            else:
                level = "HIGH"
                review_required = True
        else:
            # Fallback to variance-only
            if unc < 0.01:
                level = "LOW"
                review_required = False
            elif unc < 0.05:
                level = "MEDIUM"
                review_required = True
            else:
                level = "HIGH"
                review_required = True
            
        result = {
            "confidence": float(conf),
            "uncertainty_score": float(unc),
            "uncertainty_level": level,
            "review_required": review_required,
        }
        
        if entropy_val is not None:
            result["predictive_entropy"] = round(entropy_val, 4)
        if mi_val is not None:
            result["epistemic_uncertainty"] = round(mi_val, 4)
            
        results.append(result)
        
    return results
