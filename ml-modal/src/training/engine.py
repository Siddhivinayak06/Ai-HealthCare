import torch
import torch.nn as nn
import torch.optim as optim
import os
import time
import copy
import numpy as np
from sklearn.metrics import f1_score, roc_auc_score, confusion_matrix, classification_report
from src.config import DATA_DIR, DEVICE
from src.data_loader import (
    create_dataloaders_with_sampler,
    split_train_val,
    mixup_data,
    mixup_criterion,
)
from src.model_factory import create_model, save_model_with_metadata, unfreeze_backbone


def train_single_modality(
    modality,
    model_name="densenet",
    epochs=10,
    batch_size=16,
    lr=0.001,
    finetune=False,
    warmup_epochs=3,
    patience=5,
    label_smoothing=0.1,
    use_mixup=False,
    mixup_alpha=0.2,
):
    """
    Core training engine for medical imaging models.

    Features:
      - Progressive Unfreezing: trains classifier head first, then unfreezes backbone
      - Label Smoothing: prevents overconfident predictions
      - Mixup Training: blends samples for regularization on small datasets
      - WeightedRandomSampler: balanced mini-batches for class imbalance
      - Early Stopping: halts on val F1 plateau
      - Gradient Clipping: prevents exploding gradients during fine-tuning
      - Cosine Annealing LR: smoother learning rate decay
      - Per-class Metrics: tracks sensitivity/specificity per class
    """
    print(f"\n{'='*60}")
    print(f"  Training Pipeline: {modality.upper()} ({model_name})")
    print(f"  Fine-tuning: {finetune} | Warmup: {warmup_epochs} epochs")
    print(f"  Label Smoothing: {label_smoothing} | Mixup: {use_mixup} (α={mixup_alpha})")
    print(f"{'='*60}")

    modality_dir = os.path.join(DATA_DIR, modality)
    train_dir = os.path.join(modality_dir, "train")

    # Auto-split if val is missing
    split_train_val(modality_dir)

    # Check for data
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        print(f"⚠️  No training data found in {train_dir}. Skipping.")
        return None

    try:
        dataloaders, image_datasets = create_dataloaders_with_sampler(
            modality_dir, batch_size, modality=modality
        )
    except Exception as e:
        print(f"⚠️ Error loading data for {modality}: {e}")
        return None

    class_names = image_datasets["train"].classes
    num_classes = len(class_names)

    print(f"📊 Dataset Info ({modality}):")
    print(f"   Classes ({num_classes}): {class_names}")
    print(f"   Train: {len(image_datasets['train'])} | Val: {len(image_datasets['val'])}")

    if num_classes < 2:
        print("⚠️ Need at least 2 classes to train. Skipping.")
        return None

    # Log class distribution
    targets = image_datasets["train"].targets
    class_counts = [targets.count(i) for i in range(num_classes)]
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        print(f"   [{i}] {name}: {count} images ({count / len(targets) * 100:.1f}%)")

    # Class Weights for loss
    class_weights_tensor = torch.tensor(
        [1.0 / c for c in class_counts], dtype=torch.float
    ).to(DEVICE)

    # ── Phase 1: Frozen backbone (classifier warmup) ──────────────────
    print(
        f"\n🏗️  Phase 1: Warming up classifier head ({warmup_epochs} epochs, backbone frozen)..."
    )
    model = create_model(model_name, num_classes, pretrained=True, freeze_backbone=True)
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss(
        weight=class_weights_tensor, label_smoothing=label_smoothing
    )

    # Only optimize classifier parameters during warmup
    classifier_params = (
        model.classifier.parameters()
        if hasattr(model, "classifier")
        else model.fc.parameters()
    )
    warmup_optimizer = optim.Adam(classifier_params, lr=lr)

    best_model_wts = copy.deepcopy(model.state_dict())
    best_f1 = 0.0
    since = time.time()

    for epoch in range(warmup_epochs):
        train_loss, train_f1, _ = _run_epoch(
            model, dataloaders, image_datasets, criterion, warmup_optimizer, "train",
            use_mixup=use_mixup, mixup_alpha=mixup_alpha,
        )
        val_loss, val_f1, val_per_class = _run_epoch(
            model, dataloaders, image_datasets, criterion, None, "val"
        )

        if val_f1 > best_f1:
            best_f1 = val_f1
            best_model_wts = copy.deepcopy(model.state_dict())

        recall_str = " | ".join(
            f"{class_names[i][:6]}={r:.2f}" for i, r in val_per_class.items()
        )
        print(
            f"  Warmup {epoch+1}/{warmup_epochs} | "
            f"Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | "
            f"Val Loss: {val_loss:.4f} | Recall: [{recall_str}]"
        )

    print(f"✅ Warmup complete. Best Val F1: {best_f1:.4f}")

    # ── Phase 2: Full fine-tuning (if enabled) ────────────────────────
    if finetune:
        remaining_epochs = epochs - warmup_epochs
        if remaining_epochs <= 0:
            remaining_epochs = epochs

        print(
            f"\n🔓 Phase 2: Unfreezing backbone for full fine-tuning ({remaining_epochs} epochs)..."
        )

        model.load_state_dict(best_model_wts)
        unfreeze_backbone(model)

        # Differential learning rates
        classifier_params_list = (
            list(model.classifier.parameters())
            if hasattr(model, "classifier")
            else list(model.fc.parameters())
        )
        classifier_param_ids = set(id(p) for p in classifier_params_list)
        backbone_params = [
            p
            for p in model.parameters()
            if id(p) not in classifier_param_ids and p.requires_grad
        ]

        optimizer = optim.AdamW(
            [
                {"params": backbone_params, "lr": lr * 0.01},
                {"params": classifier_params_list, "lr": lr * 0.1},
            ],
            weight_decay=1e-4,
        )

        scheduler = optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=remaining_epochs, eta_min=1e-7
        )
        epochs_no_improve = 0

        for epoch in range(remaining_epochs):
            train_loss, train_f1, _ = _run_epoch(
                model, dataloaders, image_datasets, criterion, optimizer, "train",
                clip_grad=True, use_mixup=use_mixup, mixup_alpha=mixup_alpha,
            )
            val_loss, val_f1, val_per_class = _run_epoch(
                model, dataloaders, image_datasets, criterion, None, "val"
            )

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

            recall_str = " | ".join(
                f"{class_names[i][:6]}={r:.2f}" for i, r in val_per_class.items()
            )
            print(
                f"  Epoch {epoch+1}/{remaining_epochs} | "
                f"Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | "
                f"Val Loss: {val_loss:.4f} | LR: {current_lr:.2e} | "
                f"Recall: [{recall_str}]{improved}"
            )

            if epochs_no_improve >= patience:
                print(
                    f"⏹️  Early stopping triggered (no improvement for {patience} epochs)"
                )
                break
    else:
        remaining_epochs = epochs - warmup_epochs
        if remaining_epochs > 0:
            print(
                f"\n❄️  Continuing with frozen backbone ({remaining_epochs} more epochs)..."
            )

            classifier_params = (
                model.classifier.parameters()
                if hasattr(model, "classifier")
                else model.fc.parameters()
            )
            optimizer = optim.Adam(classifier_params, lr=lr)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=remaining_epochs, eta_min=1e-7
            )
            epochs_no_improve = 0

            for epoch in range(remaining_epochs):
                train_loss, train_f1, _ = _run_epoch(
                    model, dataloaders, image_datasets, criterion, optimizer, "train",
                    use_mixup=use_mixup, mixup_alpha=mixup_alpha,
                )
                val_loss, val_f1, val_per_class = _run_epoch(
                    model, dataloaders, image_datasets, criterion, None, "val"
                )

                scheduler.step()

                improved = ""
                if val_f1 > best_f1:
                    best_f1 = val_f1
                    best_model_wts = copy.deepcopy(model.state_dict())
                    epochs_no_improve = 0
                    improved = " ⬆️ New Best!"
                else:
                    epochs_no_improve += 1

                recall_str = " | ".join(
                    f"{class_names[i][:6]}={r:.2f}" for i, r in val_per_class.items()
                )
                print(
                    f"  Epoch {epoch+1}/{remaining_epochs} | "
                    f"Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | "
                    f"Val Loss: {val_loss:.4f} | Recall: [{recall_str}]{improved}"
                )

                if epochs_no_improve >= patience:
                    print(
                        f"⏹️  Early stopping triggered (no improvement for {patience} epochs)"
                    )
                    break

    # ── Final Results ─────────────────────────────────────────────────
    time_elapsed = time.time() - since
    print(f"\n{'='*60}")
    print(f"  ✅ {modality.upper()} Training Complete")
    print(f"     Best Val F1     : {best_f1:.4f}")
    print(f"     Time Elapsed    : {time_elapsed//60:.0f}m {time_elapsed%60:.0f}s")
    print(f"     Model           : {model_name}")
    print(f"     Fine-tuned      : {finetune}")
    print(f"     Label Smoothing : {label_smoothing}")
    print(f"     Mixup           : {use_mixup}")
    print(f"{'='*60}")

    # Full evaluation on validation set
    model.load_state_dict(best_model_wts)
    _print_final_eval(model, dataloaders, image_datasets, class_names)

    # Save with metadata
    save_path = f"model_{modality}.pth"
    training_config = {
        "model_name": model_name,
        "epochs": epochs,
        "batch_size": batch_size,
        "lr": lr,
        "finetune": finetune,
        "label_smoothing": label_smoothing,
        "mixup": use_mixup,
        "best_val_f1": round(best_f1, 4),
    }
    save_model_with_metadata(model, save_path, model_name, class_names, training_config)
    return save_path


def _run_epoch(
    model,
    dataloaders,
    image_datasets,
    criterion,
    optimizer,
    phase,
    clip_grad=False,
    use_mixup=False,
    mixup_alpha=0.2,
):
    """
    Runs one training or validation epoch.
    Returns (epoch_loss, epoch_f1, per_class_recall).
    """
    if phase == "train":
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    all_preds = []
    all_labels = []

    if len(image_datasets[phase]) == 0:
        return 0.0, 0.0, {}

    for inputs, labels in dataloaders[phase]:
        inputs = inputs.to(DEVICE)
        labels = labels.to(DEVICE)

        if optimizer:
            optimizer.zero_grad()

        with torch.set_grad_enabled(phase == "train"):
            # Apply Mixup during training if enabled
            if phase == "train" and use_mixup and optimizer:
                inputs_mixed, targets_a, targets_b, lam = mixup_data(
                    inputs, labels, mixup_alpha
                )
                outputs = model(inputs_mixed)
                loss = mixup_criterion(criterion, outputs, targets_a, targets_b, lam)
                _, preds = torch.max(outputs, 1)
            else:
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

            if phase == "train" and optimizer:
                loss.backward()
                if clip_grad:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / len(image_datasets[phase])
    epoch_f1 = f1_score(all_labels, all_preds, average="weighted", zero_division=0)

    # Per-class recall (sensitivity)
    num_classes = len(image_datasets[phase].classes)
    per_class_recall = {}
    for c in range(num_classes):
        true_c = [1 if l == c else 0 for l in all_labels]
        pred_c = [1 if p == c else 0 for p in all_preds]
        tp = sum(t == 1 and p == 1 for t, p in zip(true_c, pred_c))
        fn = sum(t == 1 and p == 0 for t, p in zip(true_c, pred_c))
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        per_class_recall[c] = recall

    return epoch_loss, epoch_f1, per_class_recall


def _print_final_eval(model, dataloaders, image_datasets, class_names):
    """Prints a detailed evaluation summary including sensitivity/specificity."""
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    if len(image_datasets["val"]) == 0:
        return

    with torch.no_grad():
        for inputs, labels in dataloaders["val"]:
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

    # Per-class Sensitivity & Specificity
    print(f"\n📊 Per-Class Metrics:")
    num_classes = len(class_names)
    for c in range(num_classes):
        tp = cm[c, c]
        fn = sum(cm[c, :]) - tp
        fp = sum(cm[:, c]) - tp
        tn = cm.sum() - tp - fn - fp

        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0

        print(
            f"   {class_names[c][:12]:<12}: "
            f"Sens={sensitivity:.4f}  Spec={specificity:.4f}  Prec={precision:.4f}"
        )

    # AUC-ROC
    try:
        probs_arr = np.array(all_probs)
        if len(class_names) == 2:
            auc = roc_auc_score(all_labels, probs_arr[:, 1])
            print(f"\n📈 AUC-ROC: {auc:.4f}")
        else:
            auc = roc_auc_score(
                all_labels, probs_arr, multi_class="ovr", average="weighted"
            )
            print(f"\n📈 AUC-ROC (weighted OVR): {auc:.4f}")
    except Exception as e:
        print(f"  (AUC-ROC could not be computed: {e})")

    # Classification Report
    print(f"\n📝 Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))
