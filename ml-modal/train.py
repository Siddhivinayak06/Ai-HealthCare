import torch
import torch.nn as nn
import torch.optim as optim
import os
import time
import argparse
import copy
from src.config import DATA_DIR, DEVICE
from src.data_loader import create_dataloaders
from src.model_factory import create_densenet_model, save_model

def parse_args():
    parser = argparse.ArgumentParser(description='Train Medical Image Analysis Models')
    parser.add_argument('--modality', type=str, default='all', choices=['xray', 'ct', 'mri', 'all', 'modality_check'])
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=0.001)
    return parser.parse_args()

def train_single_modality(modality, epochs=10, batch_size=16, lr=0.001):
    print(f"\n{'='*40}")
    print(f"Starting Training Pipeline: {modality.upper()}")
    print(f"{'='*40}")
    
    modality_dir = os.path.join(DATA_DIR, modality)
    train_dir = os.path.join(modality_dir, 'train')
    
    # Check for data
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        print(f"⚠️  No training data found in {train_dir}. Skipping.")
        return None

    try:
        dataloaders, image_datasets = create_dataloaders(modality_dir, batch_size)
    except Exception as e:
        print(f"⚠️ Error loading data for {modality}: {e}")
        return None
        
    class_names = image_datasets['train'].classes
    num_classes = len(class_names)
    
    print(f"📊 Dataset Info ({modality}):")
    print(f"   Classes ({num_classes}): {class_names}")
    print(f"   Train: {len(image_datasets['train'])} | Val: {len(image_datasets['val'])}")

    if num_classes < 2:
        print("⚠️ Need at least 2 classes to train. Skipping.")
        return None

    # Model Setup
    print("🏗️  Initializing Model...")
    model = create_densenet_model(num_classes)
    model = model.to(DEVICE)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    # Training
    since = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0
    
    print(f"🔄 Training {epochs} epochs on {DEVICE}...")

    for epoch in range(epochs):
        for phase in ['train', 'val']:
            if phase == 'train': model.train()
            else: model.eval()

            running_loss = 0.0
            running_corrects = 0
            
            # Skip if empty val set
            if len(image_datasets[phase]) == 0: continue

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(DEVICE)
                labels = labels.to(DEVICE)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
            
            if phase == 'train': scheduler.step()

            epoch_acc = running_corrects.float() / len(image_datasets[phase])
            
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())
            elif phase == 'train' and len(image_datasets['val']) == 0:
                 best_acc = epoch_acc
                 best_model_wts = copy.deepcopy(model.state_dict())

    time_elapsed = time.time() - since
    print(f"✅ {modality.upper()} Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    
    model.load_state_dict(best_model_wts)
    save_path = f'model_{modality}.pth'
    save_model(model, save_path)
    return save_path

def train_model(args):
    """Entry point"""
    if args.modality == 'all':
        saved_paths = []
        for mod in ['xray', 'ct', 'mri']:
            path = train_single_modality(mod, args.epochs, args.batch_size, args.lr)
            if path: saved_paths.append(path)
        return saved_paths
    else:
        return train_single_modality(args.modality, args.epochs, args.batch_size, args.lr)

if __name__ == "__main__":
    args = parse_args()
    train_model(args)
