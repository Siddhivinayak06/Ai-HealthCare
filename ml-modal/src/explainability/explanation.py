import os
from PIL import Image
from .gradcam import get_gradcam_explanation
from .shap_risk import get_risk_explanation

class UnifiedExplainer:
    """
    A unified interface for generating AI explanations across different modalities.
    """
    
    @staticmethod
    def explain_image(model, input_tensor, original_image, image_id, data_dir):
        """Generates heatmap and saves it, returning the URL and textual summary."""
        try:
            heatmap_img = get_gradcam_explanation(model, input_tensor, original_image)
            
            output_dir = os.path.join(data_dir, "explanations")
            os.makedirs(output_dir, exist_ok=True)
            
            filename = f"{image_id}_heatmap.png"
            heatmap_path = os.path.join(output_dir, filename)
            heatmap_img.save(heatmap_path)
            
            # Simple textual explanation based on existence of heatmap
            textual = "The AI model focused on specific localized regions to identify diagnostic patterns. These areas are highlighted in the generated heatmap."
            
            return {
                "url": f"/outputs/explanations/{filename}",
                "summary": textual
            }
        except Exception as e:
            print(f"❌ Image explanation failed: {e}")
            return None

    @staticmethod
    def explain_risk(model, input_df):
        """Generates tabular feature importance and a descriptive text summary."""
        importance = get_risk_explanation(model, input_df)
        if not importance:
            return None
            
        # Sort features by absolute importance
        sorted_features = sorted(importance.items(), key=lambda x: abs(x[1]), reverse=True)
        top_factors = [f[0].replace('_', ' ').capitalize() for f in sorted_features if f[1] > 0][:3]
        
        if top_factors:
            summary = f"The primary factors contributing to this risk level are: {', '.join(top_factors)}."
        else:
            summary = "No single vital sign showed a dominant influence on this prediction."
            
        return {
            "feature_importance": importance,
            "summary": summary
        }
