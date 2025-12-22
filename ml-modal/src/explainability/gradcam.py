import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
import matplotlib.cm as cm

class GradCAM:
    """
    Grad-CAM implementation for DenseNet121 architecture.
    Highlights regions in an image that influence the model's prediction.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.handlers = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self.handlers.append(self.target_layer.register_forward_hook(forward_hook))
        self.handlers.append(self.target_layer.register_full_backward_hook(backward_hook))

    def remove_hooks(self):
        for handler in self.handlers:
            handler.remove()

    def generate_heatmap(self, input_tensor, class_idx=None):
        """
        Generates a Grad-CAM heatmap for a given input and class.
        """
        self.model.zero_grad()
        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()

        score = output[0, class_idx]
        score.backward()

        # Weight the channels by the corresponding gradients
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        heatmap = torch.sum(weights * self.activations, dim=1, keepdim=True)

        # ReLU on heatmap
        heatmap = F.relu(heatmap)
        
        # Normalize between 0 and 1
        heatmap_min = torch.min(heatmap)
        heatmap_max = torch.max(heatmap)
        if heatmap_max > heatmap_min:
            heatmap = (heatmap - heatmap_min) / (heatmap_max - heatmap_min)
        
        return heatmap.detach().cpu().numpy()[0, 0]

    def overlay_heatmap(self, heatmap, original_image: Image.Image, alpha=0.5):
        """
        Overlays the heatmap onto the original image.
        """
        # Resize heatmap to match original image
        heatmap_resized = cv2.resize(heatmap, (original_image.width, original_image.height))
        
        # Convert heatmap to RGB using a colormap
        heatmap_color = cm.jet(heatmap_resized)[..., :3]  # Remove alpha channel if present
        heatmap_color = (heatmap_color * 255).astype(np.uint8)
        
        # Convert original image to numpy array
        img_array = np.array(original_image.convert("RGB"))
        
        # Blend images
        overlayed_img = cv2.addWeighted(img_array, 1 - alpha, heatmap_color, alpha, 0)
        
        return Image.fromarray(overlayed_img)

def get_gradcam_explanation(model, input_tensor, original_image: Image.Image, target_layer=None):
    """
    High-level utility to generate a Grad-CAM explanation.
    Auto-detects target layer for DenseNet, ResNet, and EfficientNet.
    """
    if target_layer is None:
        # Detect architecture and select last conv layer
        model_name = model.__class__.__name__.lower()
        if "densenet" in model_name:
            target_layer = model.features[-1]
        elif "resnet" in model_name:
            target_layer = model.layer4[-1]
        elif "efficientnet" in model_name:
            target_layer = model.features[-1]
        else:
            # Fallback for other CNNs: try to find the last conv2d
            for module in reversed(list(model.modules())):
                if isinstance(module, torch.nn.Conv2d):
                    target_layer = module
                    break
    
    if target_layer is None:
        raise ValueError("Could not automatically determine target layer for Grad-CAM.")

    cam = GradCAM(model, target_layer)
    try:
        heatmap = cam.generate_heatmap(input_tensor)
        overlayed_image = cam.overlay_heatmap(heatmap, original_image)
        return overlayed_image
    finally:
        cam.remove_hooks()
