import argparse
from src.training.engine import train_single_modality

ALL_MODELS = ['densenet', 'resnet', 'efficientnet', 'efficientnet_v2', 'convnext']

def main():
    parser = argparse.ArgumentParser(description='Train MRI Analysis Model')
    parser.add_argument('--model', type=str, default='densenet', choices=ALL_MODELS)
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=0.001)
    parser.add_argument('--finetune', action='store_true', help='Unfreeze backbone for fine-tuning')
    parser.add_argument('--warmup_epochs', type=int, default=3, help='Classifier warmup epochs')
    parser.add_argument('--patience', type=int, default=5, help='Early stopping patience')
    parser.add_argument('--label_smoothing', type=float, default=0.1, help='Label smoothing factor')
    parser.add_argument('--mixup', action='store_true', help='Enable Mixup augmentation')
    parser.add_argument('--mixup_alpha', type=float, default=0.2, help='Mixup interpolation strength')
    args = parser.parse_args()

    train_single_modality(
        modality='mri',
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

if __name__ == "__main__":
    main()
