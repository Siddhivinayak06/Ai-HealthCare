import pandas as pd
import argparse
import os
from src.risk import train_improved_risk_model

def main():
    parser = argparse.ArgumentParser(description='Train Risk Model with Real Data')
    parser.add_argument('--csv', type=str, default='data/real_data/heart_risk_data.csv', help='Path to patient data CSV')
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ Dataset not found at {args.csv}. Please run data_collector.py first.")
        return

    print(f"📂 Loading real patient data from {args.csv}...")
    df = pd.read_csv(args.csv)
    
    try:
        model = train_improved_risk_model(df)
        print("✅ Risk model trained successfully with real data पैटर्न!")
        print(f"Model saved to: risk_model.joblib")
    except Exception as e:
        print(f"❌ Training failed: {e}")

if __name__ == "__main__":
    main()
