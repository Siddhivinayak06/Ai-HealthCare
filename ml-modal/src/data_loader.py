from torchvision import transforms, datasets
from torch.utils.data import DataLoader
import os
import shutil
import random

def get_transforms(modality="xray"):
    # Common medical imaging augmentation
    train_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    return {'train': train_transforms, 'val': val_transforms}

def create_dataloaders(data_dir, batch_size=16):
    transforms_dict = get_transforms()
    
    image_datasets = {x: datasets.ImageFolder(os.path.join(data_dir, x), transforms_dict[x])
                      for x in ['train', 'val']}
                      
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=batch_size, shuffle=True, num_workers=0)
                   for x in ['train', 'val']}
                   
    return dataloaders, image_datasets

def split_train_val(base_dir, split_ratio=0.8):
    """Utility to split data/train into data/val if needed"""
    train_dir = os.path.join(base_dir, 'train')
    val_dir = os.path.join(base_dir, 'val')
    os.makedirs(val_dir, exist_ok=True)
    
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        return
        
    classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
    
    for cls in classes:
        src_cls = os.path.join(train_dir, cls)
        dst_cls = os.path.join(val_dir, cls)
        os.makedirs(dst_cls, exist_ok=True)
        
        # If val is empty, move 20% from train
        if not os.listdir(dst_cls):
            images = [f for f in os.listdir(src_cls) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
            random.shuffle(images)
            cutoff = int(len(images) * (1 - split_ratio))
            to_move = images[:cutoff]
            for img in to_move:
                shutil.move(os.path.join(src_cls, img), os.path.join(dst_cls, img))
            print(f"auto-split: moved {len(to_move)} images to val/{cls}")
