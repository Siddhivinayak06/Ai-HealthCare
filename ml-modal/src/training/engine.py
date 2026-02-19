import torch
import torch.nn as nn
import torch.optim as optim
import os
import time
import copy
import math
from sklearn.metrics import f1_score, roc_auc_score, confusion_matrix
from src.config import DATA_DIR, DEVICE
from src.data_loader import create_dataloaders, split_train_val
from src.model_factory import create_model, save_model, unfreeze_backbone


def train_single_modality(modality, model_name='densenet', epochs=10, batch_size=16, lr=0.001, finetune=False, warmup_epochs=3, patience=5):
    """
    Core training engine for medical imaging models.
    
    Improvements over baseline:
      - Progressive Unfreezing: trains classifier head first (warmup_epochs),
        then unfreezes the backbone for full fine-tuning.
      - Early Stopping: halts training if val F1 doesn't improve for `patience` epochs.
      - Gradient Clipping: prevents exploding gradients during fine-tuning.
      - Cosine Annealing LR: smoother learning rate decay.
      - Richer Metrics: logs AUC-ROC and confusion matrix alongside F1.
    """
    print(f"\n{'='*50}")
    print(f"  Training Pipeline: {modality.upper()} ({model_name})")
    print(f"  Fine-tuning: {finetune} | Warmup: {warmup_epochs} epochs")
    print(f"{'='*50}")
    
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

    # ── Phase 1: Frozen backbone (classifier warmup) ──────────────────
    # Always start with frozen backbone to warm up the classifier head.
    # This prevents random classifier gradients from destroying pretrained features.
    print(f"\n🏗️  Phase 1: Warming up classifier head ({warmup_epochs} epochs, backbone frozen)...")
    model = create_model(model_name, num_classes, pretrained=True, freeze_backbone=True)
    model = model.to(DEVICE)
    
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Only optimize classifier parameters during warmup
    classifier_params = model.classifier.parameters() if hasattr(model, 'classifier') else model.fc.parameters()
    warmup_optimizer = optim.Adam(classifier_params, lr=lr)
    
    best_model_wts = copy.deepcopy(model.state_dict())
    best_f1 = 0.0
    since = time.time()

    for epoch in range(warmup_epochs):
        train_loss, train_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, warmup_optimizer, 'train')
        val_loss, val_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, None, 'val')
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            best_model_wts = copy.deepcopy(model.state_dict())
        
        print(f"  Warmup {epoch+1}/{warmup_epochs} | Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | Val Loss: {val_loss:.4f}")

    print(f"✅ Warmup complete. Best Val F1: {best_f1:.4f}")

    # ── Phase 2: Full fine-tuning (if enabled) ────────────────────────
    if finetune:
        remaining_epochs = epochs - warmup_epochs
        if remaining_epochs <= 0:
            remaining_epochs = epochs  # Ensure we train for at least `epochs` more

        print(f"\n🔓 Phase 2: Unfreezing backbone for full fine-tuning ({remaining_epochs} epochs)...")
        
        # Restore best weights from warmup before unfreezing
        model.load_state_dict(best_model_wts)
        unfreeze_backbone(model)
        
        # Differential learning rates: backbone gets 10x lower LR
        classifier_params = list(model.classifier.parameters()) if hasattr(model, 'classifier') else list(model.fc.parameters())
        classifier_param_ids = set(id(p) for p in classifier_params)
        backbone_params = [p for p in model.parameters() if id(p) not in classifier_param_ids and p.requires_grad]
        
        optimizer = optim.Adam([
            {'params': backbone_params, 'lr': lr * 0.01},     # Backbone: very low LR
            {'params': classifier_params, 'lr': lr * 0.1}     # Classifier: moderate LR
        ], weight_decay=1e-4)
        
        # Cosine Annealing — smooth LR decay to near zero
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=remaining_epochs, eta_min=1e-7)
        
        # Early stopping counter
        epochs_no_improve = 0
        
        for epoch in range(remaining_epochs):
            train_loss, train_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, optimizer, 'train', clip_grad=True)
            val_loss, val_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, None, 'val')
            
            scheduler.step()
            current_lr = scheduler.get_last_lr()[0]
            
            improved = ""
            if val_f1 > best_f1:
                best_f1 = val_f1
                best_model_wts = copy.deepcopy(model.state_dict())
                epochs_no_improve = 0
                improved = " ⬆️ New Best!"
            else:
                epochs_no_improve += 1
            
            print(f"  Epoch {epoch+1}/{remaining_epochs} | Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | Val Loss: {val_loss:.4f} | LR: {current_lr:.2e}{improved}")
            
            # Early stopping
            if epochs_no_improve >= patience:
                print(f"⏹️  Early stopping triggered (no improvement for {patience} epochs)")
                break
    else:
        # No fine-tuning: continue training with frozen backbone
        remaining_epochs = epochs - warmup_epochs
        if remaining_epochs > 0:
            print(f"\n❄️  Continuing with frozen backbone ({remaining_epochs} more epochs)...")
            
            classifier_params = model.classifier.parameters() if hasattr(model, 'classifier') else model.fc.parameters()
            optimizer = optim.Adam(classifier_params, lr=lr)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=remaining_epochs, eta_min=1e-7)
            epochs_no_improve = 0

            for epoch in range(remaining_epochs):
                train_loss, train_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, optimizer, 'train')
                val_loss, val_f1 = _run_epoch(model, dataloaders, image_datasets, criterion, None, 'val')
                
                scheduler.step()

                improved = ""
                if val_f1 > best_f1:
                    best_f1 = val_f1
                    best_model_wts = copy.deepcopy(model.state_dict())
                    epochs_no_improve = 0
                    improved = " ⬆️ New Best!"
                else:
                    epochs_no_improve += 1
                
                print(f"  Epoch {epoch+1}/{remaining_epochs} | Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | Val Loss: {val_loss:.4f}{improved}")
                
                if epochs_no_improve >= patience:
                    print(f"⏹️  Early stopping triggered (no improvement for {patience} epochs)")
                    break

    # ── Final Results ─────────────────────────────────────────────────
    time_elapsed = time.time() - since
    print(f"\n{'='*50}")
    print(f"  ✅ {modality.upper()} Training Complete")
    print(f"     Best Val F1 : {best_f1:.4f}")
    print(f"     Time Elapsed: {time_elapsed//60:.0f}m {time_elapsed%60:.0f}s")
    print(f"     Fine-tuned  : {finetune}")
    print(f"{'='*50}")
    
    # Evaluate final confusion matrix on validation set
    model.load_state_dict(best_model_wts)
    _print_final_eval(model, dataloaders, image_datasets, class_names)
    
    save_path = f'model_{modality}.pth'
    save_model(model, save_path)
    return save_path


def _run_epoch(model, dataloaders, image_datasets, criterion, optimizer, phase, clip_grad=False):
    """
    Runs one training or validation epoch.
    Returns (epoch_loss, epoch_f1).
    """
    if phase == 'train':
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    if len(image_datasets[phase]) == 0:
        return 0.0, 0.0

    for inputs, labels in dataloaders[phase]:
        inputs = inputs.to(DEVICE)
        labels = labels.to(DEVICE)
        
        if optimizer:
            optimizer.zero_grad()
        
        with torch.set_grad_enabled(phase == 'train'):
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            if phase == 'train' and optimizer:
                loss.backward()
                # Gradient clipping to prevent exploding gradients
                if clip_grad:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
        
        running_loss += loss.item() * inputs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
    
    epoch_loss = running_loss / len(image_datasets[phase])
    epoch_f1 = f1_score(all_labels, all_preds, average='weighted')
    
    return epoch_loss, epoch_f1


def _print_final_eval(model, dataloaders, image_datasets, class_names):
    """Prints a detailed evaluation summary on the validation set."""
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    if len(image_datasets['val']) == 0:
        return

    with torch.no_grad():
        for inputs, labels in dataloaders['val']:
            inputs = inputs.to(DEVICE)
            labels = labels.to(DEVICE)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    # Confusion Matrix
    cm = confusion_matrix(all_labels, all_preds)
    print(f"\n📋 Confusion Matrix:")
    header = "          " + "  ".join(f"{c[:8]:>8}" for c in class_names)
    print(header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{v:>8}" for v in row)
        print(f"  {class_names[i][:8]:>8}  {row_str}")

    # AUC-ROC (binary only)
    try:
        import numpy as np
        probs_arr = np.array(all_probs)
        if len(class_names) == 2:
            auc = roc_auc_score(all_labels, probs_arr[:, 1])
            print(f"\n📈 AUC-ROC: {auc:.4f}")
        else:
            auc = roc_auc_score(all_labels, probs_arr, multi_class='ovr', average='weighted')
            print(f"\n📈 AUC-ROC (weighted OVR): {auc:.4f}")
    except Exception as e:
        print(f"  (AUC-ROC could not be computed: {e})")
