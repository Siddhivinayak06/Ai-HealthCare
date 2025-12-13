import os
import shutil
import random
from src.config import DATA_DIR

def prepare_modality_dataset():
    target_dir = os.path.join(DATA_DIR, "modality_check")
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    
    os.makedirs(os.path.join(target_dir, "train"), exist_ok=True)
    os.makedirs(os.path.join(target_dir, "val"), exist_ok=True)
    
    # Source map: scan_type -> source_folder
    # We need to find where exactly the images are.
    # Based on previous `list_dir`:
    # xray -> train/NORMAL, train/PNEUMONIA
    # ct -> train/Normal, train/Tumor
    # mri -> train/Normal, train/Brain_Tumor
    
    sources = {
        "xray": ["xray/train/NORMAL", "xray/train/PNEUMONIA"],
        "ct": ["ct/train/Normal", "ct/train/Tumor"],
        "mri": ["mri/train/Normal", "mri/train/Brain_Tumor"]
    }
    
    SAMPLES_PER_CLASS = 100 # Take 100 images from each modality
    
    print("🚀 Preparing modality classification dataset...")
    
    for modality, paths in sources.items():
        print(f"Processing {modality}...")
        
        # Collect all valid image paths for this modality
        all_images = []
        for p in paths:
            full_path = os.path.join(DATA_DIR, p)
            if not os.path.exists(full_path):
                print(f"  ⚠️ Warning: Path not found {full_path}")
                continue
                
            for f in os.listdir(full_path):
                if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                    all_images.append(os.path.join(full_path, f))
        
        # Sample
        if len(all_images) > SAMPLES_PER_CLASS:
            selected = random.sample(all_images, SAMPLES_PER_CLASS)
        else:
            selected = all_images
            
        print(f"  Found {len(all_images)} images, using {len(selected)}")
        
        # Copy to target
        # Structure: data/modality_check/train/xray, data/modality_check/train/ct, ...
        train_dest = os.path.join(target_dir, "train", modality)
        val_dest = os.path.join(target_dir, "val", modality)
        os.makedirs(train_dest, exist_ok=True)
        os.makedirs(val_dest, exist_ok=True)
        
        # Split 80/20
        split_idx = int(len(selected) * 0.8)
        train_imgs = selected[:split_idx]
        val_imgs = selected[split_idx:]
        
        for img in train_imgs:
            shutil.copy(img, os.path.join(train_dest, os.path.basename(img)))
            
        for img in val_imgs:
            shutil.copy(img, os.path.join(val_dest, os.path.basename(img)))

    print(f"✅ Dataset prepared at {target_dir}")

if __name__ == "__main__":
    prepare_modality_dataset()
