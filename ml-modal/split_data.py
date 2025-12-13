
import os
import shutil
import random
import argparse

def split_data(base_dir, split_ratio=0.8):
    """
    Splits data from 'train' folder into 'train' and 'val' automatically.
    
    Args:
        base_dir: Path to modality folder (e.g., 'data/ct')
        split_ratio: Percentage of data to keep in train (default 80%)
    """
    if not os.path.exists(base_dir):
        print(f"❌ Directory not found: {base_dir}")
        return

    train_dir = os.path.join(base_dir, 'train')
    val_dir = os.path.join(base_dir, 'val')
    
    # Ensure train directory has content
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        print(f"⚠️  No data found in {train_dir}. Please add images there first.")
        return

    classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
    
    if not classes:
         print(f"⚠️  No class folders found in {train_dir}.")
         return

    print(f"\n🔄 Splitting data in {base_dir} (Ratio: {split_ratio*100:.0f}% Train / {(1-split_ratio)*100:.0f}% Val)")

    for cls in classes:
        src_cls_dir = os.path.join(train_dir, cls)
        val_cls_dir = os.path.join(val_dir, cls)
        os.makedirs(val_cls_dir, exist_ok=True)
        
        # Get all images
        images = [f for f in os.listdir(src_cls_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        # Determine split index
        split_idx = int(len(images) * split_ratio)
        
        # Identify images to move to validation
        # By default we assume all images are initially in 'train'. 
        # We will move random 20% to 'val'.
        
        # Check if already split (simple heuristic: if val has files, skip or ask)
        if len(os.listdir(val_cls_dir)) > 0:
             print(f"   ℹ️  Class '{cls}' already has validation data. Skipping.")
             continue
             
        # Shuffle and move
        random.shuffle(images)
        val_images = images[split_idx:]
        
        count = 0
        for img in val_images:
            shutil.move(os.path.join(src_cls_dir, img), os.path.join(val_cls_dir, img))
            count += 1
            
        print(f"   ✅ Moved {count} images to val/{cls}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--modality', type=str, required=True, choices=['xray', 'ct', 'mri', 'all'])
    args = parser.parse_args()
    
    if args.modality == 'all':
        for mod in ['xray', 'ct', 'mri']:
            split_data(os.path.join('data', mod))
    else:
         split_data(os.path.join('data', args.modality))
