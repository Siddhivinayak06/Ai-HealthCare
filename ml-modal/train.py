import argparse
from src.training.engine import train_single_modality

def parse_args():
    parser = argparse.ArgumentParser(description='Train Medical Image Analysis Models')
    parser.add_argument('--modality', type=str, default='all', choices=['xray', 'ct', 'mri', 'all', 'modality_check'])
    parser.add_argument('--model', type=str, default='densenet', choices=['densenet', 'resnet', 'efficientnet', 'efficientnet_v2', 'convnext'])
    parser.add_argument('--epochs', type=int, default=20, help='Total training epochs (warmup + fine-tuning)')
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=0.001, help='Base learning rate (backbone gets 0.01x)')
    parser.add_argument('--finetune', action='store_true', help='Enable progressive backbone fine-tuning')
    parser.add_argument('--warmup_epochs', type=int, default=3, help='Epochs to train classifier head before unfreezing backbone')
    parser.add_argument('--patience', type=int, default=5, help='Early stopping patience (epochs without improvement)')
    return parser.parse_args()

def train_model(args):
    """
    Main training dispatcher for multiple modalities.
    Maintains compatibility with the legacy API trigger in main.py.
    """
    if args.modality == 'all':
        saved_paths = []
        for mod in ['xray', 'ct', 'mri']:
            path = train_single_modality(
                mod, args.model, args.epochs, args.batch_size, args.lr,
                args.finetune, args.warmup_epochs, args.patience
            )
            if path: saved_paths.append(path)
        return saved_paths
    else:
        return train_single_modality(
            args.modality, args.model, args.epochs, args.batch_size, args.lr,
            args.finetune, args.warmup_epochs, args.patience
        )

if __name__ == "__main__":
    args = parse_args()
    train_model(args)
