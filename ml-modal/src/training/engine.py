import torch
import torch.nn as nn
import torch.optim as optim
import os
import time
import copy
from sklearn.metrics import f1_score
from src.config import DATA_DIR, DEVICE
from src.data_loader import create_dataloaders, split_train_val
from src.model_factory import create_model, save_model

def train_single_modality(modality, model_name='densenet', epochs=10, batch_size=16, lr=0.001, finetune=False):
    """
    Core training engine for medical imaging models.
    """
    print(f"\n{'='*40}")
    print(f"Starting Training Pipeline: {modality.upper()} ({model_name})")
    print(f"{'='*40}")
    
    modality_dir = os.path.join(DATA_DIR, modality)
    train_dir = os.path.join(modality_dir, 'train')
    
    # Auto-split if val is missing
    split_train_val(modality_dir)

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

    # Class Weights for Imbalance
    targets = image_datasets['train'].targets
    class_counts = torch.tensor([targets.count(i) for i in range(num_classes)])
    class_weights = 1. / class_counts.float()
    class_weights = class_weights.to(DEVICE)

    # Model Setup
    print(f"🏗️  Initializing {model_name} (Fine-tuning: {finetune})...")
    model = create_model(model_name, num_classes, pretrained=True, freeze_backbone=not finetune)
    model = model.to(DEVICE)
    
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    
    if finetune:
        classifier_params = model.classifier.parameters() if hasattr(model, 'classifier') else model.fc.parameters()
        backbone_params = [p for name, p in model.named_parameters() if 'classifier' not in name and 'fc' not in name]
        optimizer = optim.Adam([
            {'params': backbone_params, 'lr': lr * 0.1},
            {'params': classifier_params, 'lr': lr}
        ])
    else:
        optimizer = optim.Adam(model.parameters(), lr=lr)
        
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=2, factor=0.5)

    # Training
    since = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_f1 = 0.0
    
    for epoch in range(epochs):
        for phase in ['train', 'val']:
            if phase == 'train': model.train()
            else: model.eval()

            running_loss = 0.0
            all_preds = []
            all_labels = []
            
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
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
            
            epoch_loss = running_loss / len(image_datasets[phase])
            epoch_f1 = f1_score(all_labels, all_preds, average='weighted')
            
            if phase == 'val':
                scheduler.step(epoch_loss)
                if epoch_f1 > best_f1:
                    best_f1 = epoch_f1
                    best_model_wts = copy.deepcopy(model.state_dict())
            elif phase == 'train' and len(image_datasets['val']) == 0:
                 best_f1 = epoch_f1
                 best_model_wts = copy.deepcopy(model.state_dict())
        
        print(f"Epoch {epoch}/{epochs-1} | Loss: {epoch_loss:.4f} | F1: {epoch_f1:.4f}")

    time_elapsed = time.time() - since
    print(f"✅ {modality.upper()} Training complete. Best Val F1: {best_f1:.4f}")
    
    model.load_state_dict(best_model_wts)
    save_path = f'model_{modality}.pth'
    save_model(model, save_path)
    return save_path
