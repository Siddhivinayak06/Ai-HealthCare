import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import os
import time

# Configuration
DATA_DIR = 'data'
MODEL_SAVE_PATH = 'medical_model.pth'
NUM_EPOCHS = 5
BATCH_SIZE = 32
LEARNING_RATE = 0.001
NUM_CLASSES = 2  # e.g., Normal vs Pneumonia

def train_model():
    print("Starting training pipeline...")
    
    # Check if data exists
    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory '{DATA_DIR}' not found.")
        print("Please create a 'data' folder with 'train' and 'val' subfolders containing your class images.")
        return

    # Device Configuration
    if torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using Device: MPS (Mac GPU)")
    elif torch.cuda.is_available():
        device = torch.device("cuda:0")
        print("Using Device: CUDA (NVIDIA GPU)")
    else:
        device = torch.device("cpu")
        print("Using Device: CPU (Slow)")

    # Reduced Batch Size for stability
    BATCH_SIZE = 8

    # Data Augmentation & Normalization
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'test': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # Load Data
    image_datasets = {x: datasets.ImageFolder(os.path.join(DATA_DIR, x), data_transforms[x])
                      for x in ['train', 'test']}
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
                   for x in ['train', 'test']}
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'test']}
    class_names = image_datasets['train'].classes
    
    print(f"Classes found: {class_names}")

    # Use DenseNet121 (Standard for Medical Imaging)
    model = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
    
    # Freeze initial layers (Transfer Learning)
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace classifier
    num_ftrs = model.classifier.in_features
    model.classifier = nn.Linear(num_ftrs, NUM_CLASSES)
    
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.classifier.parameters(), lr=LEARNING_RATE, momentum=0.9)

    # Training Loop
    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch}/{NUM_EPOCHS - 1}')
        print('-' * 10)

        for phase in ['train', 'test']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            # Iterate over data.
            for i, (inputs, labels) in enumerate(dataloaders[phase]):
                if i % 10 == 0:
                    print(f"  {phase} Batch {i}/{len(dataloaders[phase])}")
                
                inputs = inputs.to(device)
                labels = labels.to(device)


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

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.float() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

    print('Training complete')
    
    # Save Model
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_model()
