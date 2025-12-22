import torch
from threading import Lock
from typing import Dict

# Global model cache
MODELS: Dict[str, torch.nn.Module] = {}

# Lock for training and model loading synchronization
training_lock = Lock()
