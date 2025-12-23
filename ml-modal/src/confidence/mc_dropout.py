import torch
import torch.nn as nn

def apply_dropout(m):
    """
    Enables dropout during inference for Monte Carlo Dropout.
    """
    if type(m) == nn.Dropout:
        m.train()

def get_mc_predictions(model, input_tensor, num_samples=10):
    """
    Performs multiple forward passes with dropout enabled to estimate uncertainty.
    """
    model.eval()
    # Force dropout layers to stay in training mode
    model.apply(apply_dropout)
    
    preds = []
    with torch.no_grad():
        for _ in range(num_samples):
            output = model(input_tensor)
            # Assuming output is logits, apply softmax
            prob = torch.softmax(output, dim=1)
            preds.append(prob)
            
    # Stack predictions: [num_samples, batch_size, num_classes]
    preds = torch.stack(preds)
    
    # Calculate mean and variance
    mean_preds = torch.mean(preds, dim=0)
    variance_preds = torch.var(preds, dim=0)
    
    return mean_preds, variance_preds
