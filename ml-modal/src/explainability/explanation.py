from .gradcam import get_gradcam_explanation
from .shap_risk import get_risk_explanation
from ..confidence.services import get_prediction_with_confidence
import os

class UnifiedExplainer:
    """
    A unified interface for generating AI explanations across different modalities.
    """
    
    @staticmethod
    def explain_image(model, input_tensor, original_image, image_id, data_dir, diagnosis=None):
        """Generates heatmap and saves it, returning the URL and textual summary."""
        try:
            # Ensure input requires grad for GradCAM backward pass
            if not input_tensor.requires_grad:
                input_tensor.requires_grad_(True)

            # 1. Visual Heatmap (Grad-CAM)
            heatmap_img = get_gradcam_explanation(model, input_tensor, original_image)
            
            output_dir = os.path.join(data_dir, "explanations")
            os.makedirs(output_dir, exist_ok=True)
            
            filename = f"{image_id}_heatmap.png"
            heatmap_path = os.path.join(output_dir, filename)
            heatmap_img.save(heatmap_path)
            
            # 2. Confidence Estimation (MC Dropout)
            conf_metrics = get_prediction_with_confidence(model, input_tensor)["confidence_metrics"]
            
            # 3. Enhanced Textual Summary
            if diagnosis:
                textual = UnifiedExplainer._generate_narrative(diagnosis, conf_metrics)
            else:
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
    def _generate_narrative(diagnosis, conf_metrics):
        """Generates a dynamic detailed explanation based on analysis data."""
        severity = diagnosis.get("severity", "Unknown")
        prediction = diagnosis.get("prediction", "Unknown classification")
        findings = diagnosis.get("findings", [])
        img_stats = diagnosis.get("image_analysis", {})
        
        narrative = f"**Analysis Summary:** The AI model has classified this scan as **{prediction}** with a severity level of **{severity}**.\n\n"
        
        # Confidence Context
        narrative += f"**Confidence Assessment:** The system is {conf_metrics['confidence']:.1%} confident in this result. "
        if conf_metrics['uncertainty_level'] == "High":
            narrative += "However, high model uncertainty was detected, suggesting this case may be ambiguous or an edge case. Human verification is strongly advised.\n\n"
        else:
            narrative += "The uncertainty metrics are within acceptable ranges for automated triage.\n\n"
            
        # Visual Analysis Context
        narrative += "**Visual Evidence:** The generated heatmap (Grad-CAM) highlights the regions most influential in this decision. "
        if severity in ["High", "Critical"]:
            narrative += "You should inspect the highlighted 'hot' regions for potential abnormalities such as opacities or structural irregularities.\n\n"
        else:
            narrative += "For normal scans, these highlights typically correspond to standard anatomical landmarks verified by the model.\n\n"
            
        # Technical Signal Analysis
        narrative += "**Technical Indicators:**\n"
        if img_stats:
            entropy = img_stats.get("entropy", 0)
            contrast = img_stats.get("contrast", 0)
            
            if entropy > 5.0:
                narrative += f"- **High Tectural Complexity (Entropy: {entropy:.2f}):** This often correlates with pathological textures or noise.\n"
            else:
                narrative += f"- **Uniform Texture (Entropy: {entropy:.2f}):** Suggests consistent tissue density.\n"
                
            if contrast < 50:
                narrative += f"- **Low Contrast ({contrast:.1f}):** The scan has low dynamic range, which might affect subtle feature detection.\n"
            else:
                narrative += f"- **Good Contrast ({contrast:.1f}):** Image quality is sufficient for reliable feature extraction.\n"
        
        # Findings List
        if findings:
            narrative += "\n**Detailed Findings:**\n"
            for find in findings:
                narrative += f"- {find}\n"
                
        return narrative

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
