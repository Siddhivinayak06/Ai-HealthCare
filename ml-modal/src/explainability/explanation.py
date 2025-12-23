from .gradcam import get_gradcam_explanation
from .shap_risk import get_risk_explanation
from ..confidence.services import get_prediction_with_confidence
import os

class UnifiedExplainer:
    """
    A unified interface for generating AI explanations across different modalities.
    """
    
    @staticmethod
    def explain_image(model, input_tensor, original_image, image_id, data_dir):
        """Generates heatmap and saves it, returning the URL and textual summary."""
        try:
            # 1. Visual Heatmap (Grad-CAM)
            heatmap_img = get_gradcam_explanation(model, input_tensor, original_image)
            
            output_dir = os.path.join(data_dir, "explanations")
            os.makedirs(output_dir, exist_ok=True)
            
            filename = f"{image_id}_heatmap.png"
            heatmap_path = os.path.join(output_dir, filename)
            heatmap_img.save(heatmap_path)
            
            # 2. Confidence Estimation (MC Dropout)
            conf_metrics = get_prediction_with_confidence(model, input_tensor)["confidence_metrics"]
            
            # 3. Textual Summary
            textual = f"The AI model focused on specific localized regions to identify diagnostic patterns. "
            textual += f"Confidence level is {conf_metrics['confidence']:.1%} with {conf_metrics['uncertainty_level']} uncertainty."
            
            return {
                "url": f"/outputs/explanations/{filename}",
                "summary": textual,
                "confidence_metrics": conf_metrics
            }
        except Exception as e:
            print(f"❌ Image explanation failed: {e}")
            return None

    @staticmethod
    def explain_risk(model, input_df):
        """Generates tabular feature importance and a descriptive text summary."""
        # Risk models (XGBoost/LightGBM) don't use MC Dropout the same way, 
        # but we can use the structured output from shap_risk.
        explanation_data = get_risk_explanation(model, input_df)
        if "error" in explanation_data:
            return None
            
        return {
            "feature_importance": explanation_data["raw_shap"],
            "structured_summary": explanation_data["structured_summary"],
            "doctor_note": explanation_data["doctor_note"],
            "summary": explanation_data["doctor_note"]
        }
