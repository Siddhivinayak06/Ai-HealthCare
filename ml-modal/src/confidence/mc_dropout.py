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
    Returns mean predictions, variance, and predictive entropy.
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
    
    # Predictive entropy: H[y|x] = -Σ p̄ log p̄
    # This measures total uncertainty (aleatoric + epistemic)
    eps = 1e-10
    predictive_entropy = -torch.sum(mean_preds * torch.log(mean_preds + eps), dim=1)
    
    # Mutual information (epistemic uncertainty): I[y, θ|x] = H[y|x] - E[H[y|x,θ]]
    # Average entropy of individual predictions
    individual_entropies = -torch.sum(preds * torch.log(preds + eps), dim=2)  # [N, batch]
    mean_entropy = torch.mean(individual_entropies, dim=0)  # [batch]
    mutual_information = predictive_entropy - mean_entropy
    
    # Revert dropout layers back to evaluation mode
    model.eval()
    
    return mean_preds, variance_preds, predictive_entropy, mutual_information
