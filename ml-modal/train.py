import argparse
from src.training.engine import train_single_modality

ALL_MODELS = ['densenet', 'resnet', 'efficientnet', 'efficientnet_v2', 'convnext']

def parse_args():
    parser = argparse.ArgumentParser(description='Train Medical Image Analysis Models')
    parser.add_argument('--modality', type=str, default='all', choices=['xray', 'ct', 'mri', 'all', 'modality_check'])
    parser.add_argument('--model', type=str, default='densenet', choices=ALL_MODELS)
    parser.add_argument('--epochs', type=int, default=20, help='Total training epochs (warmup + fine-tuning)')
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=0.001, help='Base learning rate (backbone gets 0.01x)')
    parser.add_argument('--finetune', action='store_true', help='Enable progressive backbone fine-tuning')
    parser.add_argument('--warmup_epochs', type=int, default=3, help='Epochs to train classifier head before unfreezing backbone')
    parser.add_argument('--patience', type=int, default=5, help='Early stopping patience (epochs without improvement)')
    parser.add_argument('--label_smoothing', type=float, default=0.1, help='Label smoothing factor (0=disabled)')
    parser.add_argument('--mixup', action='store_true', help='Enable Mixup augmentation')
    parser.add_argument('--mixup_alpha', type=float, default=0.2, help='Mixup interpolation strength')
    return parser.parse_args()

def train_model(args):
    """
    Main training dispatcher for multiple modalities.
    Maintains compatibility with the legacy API trigger in main.py.
    """
    common_kwargs = dict(
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        finetune=args.finetune,
        warmup_epochs=args.warmup_epochs,
        patience=args.patience,
        label_smoothing=args.label_smoothing,
        use_mixup=args.mixup,
        mixup_alpha=args.mixup_alpha,
    )

    if args.modality == 'all':
        saved_paths = []
        for mod in ['xray', 'ct', 'mri']:
            path = train_single_modality(modality=mod, **common_kwargs)
            if path:
                saved_paths.append(path)
        return saved_paths
    else:
        return train_single_modality(modality=args.modality, **common_kwargs)

if __name__ == "__main__":
    args = parse_args()
    train_model(args)
