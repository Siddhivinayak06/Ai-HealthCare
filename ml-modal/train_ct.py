import argparse
from src.training.engine import train_single_modality

def main():
    parser = argparse.ArgumentParser(description='Train CT Scan Analysis Model')
    parser.add_argument('--model', type=str, default='densenet', choices=['densenet', 'resnet', 'efficientnet'])
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=0.001)
    parser.add_argument('--finetune', action='store_true', help='Unfreeze backbone')
    args = parser.parse_args()

    train_single_modality(
        modality='ct',
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        finetune=args.finetune
    )

if __name__ == "__main__":
    main()
