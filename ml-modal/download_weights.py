import os
import json
import urllib.request
import urllib.error

REPO = "Siddhivinayak06/Ai-HealthCare"
WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")

def download_latest_release_assets():
    print(f"Fetching latest release metadata from {REPO}...")
    api_url = f"https://api.github.com/repos/{REPO}/releases/latest"
    
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            release_data = json.loads(response.read().decode())
    except urllib.error.URLError as e:
        print(f"Error fetching release data: {e}")
        print("Note: If you have not created a GitHub release yet with the model weights, this script will fail.")
        print("Please create a GitHub release on the repository and upload your model weights as assets.")
        return

    assets = release_data.get("assets", [])
    if not assets:
        print("No assets found in the latest release. Please make sure you have attached the weights files to the latest release.")
        return

    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    print(f"Found {len(assets)} asset(s). Checking for model weights...")

    downloaded = False
    for asset in assets:
        asset_name = asset["name"]
        download_url = asset["browser_download_url"]
        
        # Target common ML model weight extensions
        valid_extensions = (".pth", ".pt", ".h5", ".joblib", ".bin", ".onnx", ".pkl")
        if not asset_name.lower().endswith(valid_extensions):
            continue
            
        file_path = os.path.join(WEIGHTS_DIR, asset_name)
        
        # Skip if already exists
        if os.path.exists(file_path):
            print(f" - {asset_name} already exists in weights/. Skipping.")
            downloaded = True
            continue
            
        size_mb = asset['size'] / (1024 * 1024)
        print(f" - Downloading {asset_name} ({size_mb:.2f} MB)...")
        
        try:
            req = urllib.request.Request(download_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(file_path, 'wb') as out_file:
                chunk_size = 16 * 1024
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    out_file.write(chunk)
            print(f"   Successfully downloaded {asset_name}.")
            downloaded = True
        except Exception as e:
            print(f"   Error downloading {asset_name}: {e}")

    if not downloaded:
        print("\nNo valid model weight files found in the latest release.")
        print("Please ensure your assets have extensions like .pth, .h5, .joblib, or .pkl")

if __name__ == "__main__":
    download_latest_release_assets()
    print("Download script complete!")
