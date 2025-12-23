import torch
import numpy as np

def calculate_uncertainty(mean_preds, variance_preds):
    """
    Calculates unified confidence and uncertainty metrics.
    """
    # Confidence is the maximum probability
    confidence_scores = torch.max(mean_preds, dim=1)[0].cpu().numpy()
    
    # Uncertainty is derived from variance (entropy could also be used)
    # Average variance across all classes as a simple uncertainty measure
    uncertainty_values = torch.mean(variance_preds, dim=1).cpu().numpy()
    
    results = []
    for conf, unc in zip(confidence_scores, uncertainty_values):
        # Normalize uncertainty for categorization
        # In a real scenario, these thresholds would be calibrated
        if unc < 0.01:
            level = "LOW"
            review_required = False
        elif unc < 0.05:
            level = "MEDIUM"
            review_required = True
        else:
            level = "HIGH"
            review_required = True
            
        results.append({
            "confidence": float(conf),
            "uncertainty_score": float(unc),
            "uncertainty_level": level,
            "review_required": review_required
        })
        
    return results
