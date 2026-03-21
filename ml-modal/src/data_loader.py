from torchvision import transforms, datasets
from torch.utils.data import DataLoader, WeightedRandomSampler
import torch
import numpy as np
import os
import shutil
import random
import cv2
from PIL import Image


# ─── CLAHE Transform (for training-time consistency with inference) ───────────

class CLAHETransform:
    """Applies CLAHE contrast enhancement as a torchvision-compatible transform."""

    def __init__(self, clip_limit=3.0, tile_size=8):
        self.clip_limit = clip_limit
        self.tile_size = tile_size

    def __call__(self, img: Image.Image) -> Image.Image:
        img_array = np.array(img)
        clahe = cv2.createCLAHE(
            clipLimit=self.clip_limit,
            tileGridSize=(self.tile_size, self.tile_size),
        )
        if len(img_array.shape) == 2:
            enhanced = clahe.apply(img_array)
        else:
            channels = cv2.split(img_array)
            enhanced_channels = [clahe.apply(ch) for ch in channels]
            enhanced = cv2.merge(enhanced_channels)
        return Image.fromarray(enhanced)


# ─── Modality-Specific Augmentation Pipelines ────────────────────────────────

def get_transforms(modality="xray"):
    """
    Returns modality-specific train/val transforms.
    
    - X-Ray: No vertical flip (anatomical orientation matters), heavier brightness jitter
    - CT: Allow both flips, moderate rotation, elastic-like affine distortion
    - MRI: Allow both flips, wider rotation, stronger blur for noise simulation
    - modality_check: Lighter augmentation (task is modality classification, not pathology)
    """

    # Common normalization (ImageNet pretrained backbone)
    normalize = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])

    if modality == "xray":
        train_transforms = transforms.Compose([
            CLAHETransform(clip_limit=3.0),
            transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            # No vertical flip — chest X-rays have fixed orientation
            transforms.RandomRotation(15),
            transforms.RandomAffine(degrees=0, translate=(0.08, 0.08), scale=(0.92, 1.08)),
            transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.1),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 0.8)),
            transforms.ToTensor(),
            normalize,
            transforms.RandomErasing(p=0.15, scale=(0.02, 0.1)),
        ])
    elif modality == "ct":
        train_transforms = transforms.Compose([
            CLAHETransform(clip_limit=2.5),
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.3),
            transforms.RandomRotation(25),
            transforms.RandomAffine(degrees=0, translate=(0.12, 0.12), scale=(0.85, 1.15)),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.05),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.2)),
            transforms.ToTensor(),
            normalize,
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
        ])
    elif modality == "mri":
        train_transforms = transforms.Compose([
            CLAHETransform(clip_limit=2.0),
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.3),
            transforms.RandomRotation(30),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.88, 1.12)),
            transforms.ColorJitter(brightness=0.25, contrast=0.35, saturation=0.05),
            transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 1.5)),
            transforms.ToTensor(),
            normalize,
            transforms.RandomErasing(p=0.2, scale=(0.03, 0.15)),
        ])
    elif modality == "modality_check":
        # Lighter augmentation — we want the model to learn structural modality differences
        train_transforms = transforms.Compose([
            CLAHETransform(clip_limit=2.0),
            transforms.RandomResizedCrop(224, scale=(0.85, 1.0)),
            transforms.RandomHorizontalFlip(p=0.3),
            transforms.RandomRotation(10),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            normalize,
        ])
    else:
        # Fallback: generic medical augmentation
        train_transforms = transforms.Compose([
            CLAHETransform(clip_limit=2.5),
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(p=0.3),
            transforms.RandomRotation(20),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.1),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.0)),
            transforms.ToTensor(),
            normalize,
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
        ])

    # Validation transforms: deterministic, with CLAHE for consistency
    val_transforms = transforms.Compose([
        CLAHETransform(clip_limit=2.5),
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        normalize,
    ])

    return {"train": train_transforms, "val": val_transforms}


# ─── Data Loading with Weighted Sampling ──────────────────────────────────────

def create_dataloaders(data_dir, batch_size=16, modality="xray"):
    """Creates train/val dataloaders with modality-specific augmentations."""
    transforms_dict = get_transforms(modality)

    image_datasets = {
        x: datasets.ImageFolder(os.path.join(data_dir, x), transforms_dict[x])
        for x in ["train", "val"]
    }

    dataloaders = {
        x: DataLoader(image_datasets[x], batch_size=batch_size, shuffle=True, num_workers=0)
        for x in ["train", "val"]
    }

    return dataloaders, image_datasets


def create_dataloaders_with_sampler(data_dir, batch_size=16, modality="xray"):
    """
    Creates train/val dataloaders with WeightedRandomSampler for balanced batches.
    This ensures minority classes are sampled proportionally during training.
    """
    transforms_dict = get_transforms(modality)

    image_datasets = {
        x: datasets.ImageFolder(os.path.join(data_dir, x), transforms_dict[x])
        for x in ["train", "val"]
    }

    # Build weighted sampler for training set
    train_targets = image_datasets["train"].targets
    class_counts = np.bincount(train_targets)
    class_weights = 1.0 / class_counts
    sample_weights = [class_weights[t] for t in train_targets]
    sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )

    dataloaders = {
        "train": DataLoader(
            image_datasets["train"],
            batch_size=batch_size,
            sampler=sampler,  # Replaces shuffle=True
            num_workers=0,
        ),
        "val": DataLoader(
            image_datasets["val"],
            batch_size=batch_size,
            shuffle=False,
            num_workers=0,
        ),
    }

    return dataloaders, image_datasets


# ─── Mixup Augmentation ──────────────────────────────────────────────────────

def mixup_data(x, y, alpha=0.2):
    """
    Performs Mixup augmentation: blends pairs of training samples.
    
    Args:
        x: input batch [B, C, H, W]
        y: label batch [B]
        alpha: Beta distribution parameter (0.2 is standard for medical imaging)
    
    Returns:
        mixed_x, y_a, y_b, lam
    """
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1.0

    batch_size = x.size(0)
    index = torch.randperm(batch_size, device=x.device)

    mixed_x = lam * x + (1 - lam) * x[index]
    y_a, y_b = y, y[index]

    return mixed_x, y_a, y_b, lam


def mixup_criterion(criterion, pred, y_a, y_b, lam):
    """Computes the Mixup-weighted loss."""
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


# ─── Train/Val Split Utility ─────────────────────────────────────────────────

def split_train_val(base_dir, split_ratio=0.8):
    """Utility to split data/train into data/val if needed."""
    train_dir = os.path.join(base_dir, "train")
    val_dir = os.path.join(base_dir, "val")
    os.makedirs(val_dir, exist_ok=True)

    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        return

    classes = [
        d for d in os.listdir(train_dir)
        if os.path.isdir(os.path.join(train_dir, d))
    ]

    for cls in classes:
        src_cls = os.path.join(train_dir, cls)
        dst_cls = os.path.join(val_dir, cls)
        os.makedirs(dst_cls, exist_ok=True)

        # If val is empty, move 20% from train
        if not os.listdir(dst_cls):
            images = [
                f for f in os.listdir(src_cls)
                if f.lower().endswith((".jpg", ".png", ".jpeg"))
            ]
            random.shuffle(images)
            cutoff = int(len(images) * (1 - split_ratio))
            to_move = images[:cutoff]
            for img in to_move:
                shutil.move(os.path.join(src_cls, img), os.path.join(dst_cls, img))
            print(f"auto-split: moved {len(to_move)} images to val/{cls}")
