from .mc_dropout import get_mc_predictions
from .uncertainty import calculate_uncertainty

def get_prediction_with_confidence(model, input_tensor):
    """
    Wrapper to get model prediction along with confidence and uncertainty.
    """
    mean_preds, variance_preds = get_mc_predictions(model, input_tensor)
    confidence_data = calculate_uncertainty(mean_preds, variance_preds)
    
    # Get the class with highest mean probability
    predicted_class = torch.argmax(mean_preds, dim=1).item()
    
    return {
        "prediction": predicted_class,
        "confidence_metrics": confidence_data[0] # Return for the first sample in batch
    }
