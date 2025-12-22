import pandas as pd
import numpy as np
import requests
import os
import json

DATA_DIR = "data/real_data"
os.makedirs(DATA_DIR, exist_ok=True)

def download_risk_dataset():
    """
    Downloads UCI Heart Disease dataset and formats it to our schema.
    Original columns: age, sex, cp, trestbps (sys_bp), chol, fbs (glucose > 120), 
    restecg, thalach, exang, oldpeak, slope, ca, thal, target (risk)
    """
    print("🚀 Downloading UCI Heart Disease dataset...")
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
    
    cols = [
        'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
        'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target'
    ]
    
    try:
        df = pd.read_csv(url, names=cols, na_values='?')
        df = df.dropna()
        
        # Mapping/Simulating to our schema: 
        # ['age', 'bmi', 'sys_bp', 'dia_bp', 'glucose', 'cholesterol', 'smoker']
        real_df = pd.DataFrame()
        real_df['age'] = df['age']
        real_df['sys_bp'] = df['trestbps']
        real_df['dia_bp'] = df['trestbps'] * 0.65  # Simulated diastolic
        real_df['cholesterol'] = df['chol']
        real_df['glucose'] = np.where(df['fbs'] == 1, 140, 95) # Simulated glucose based on fbs flag
        real_df['smoker'] = np.random.randint(0, 2, len(df)) # Simulated smoker status (UCI doesn't have it)
        
        # Simulate BMI based on age and basic stats
        real_df['bmi'] = np.random.normal(27, 4, len(df))
        
        # Target: Risk Level (Binary)
        real_df['risk_label'] = (df['target'] > 0).astype(int)
        
        output_path = os.path.join(DATA_DIR, "heart_risk_data.csv")
        real_df.to_csv(output_path, index=False)
        print(f"✅ Risk dataset saved to: {output_path} ({len(real_df)} records)")
        return output_path
    
    except Exception as e:
        print(f"❌ Failed to download UCI dataset: {e}")
        return None

def download_nlp_samples():
    """
    Downloads a proper medical NLP dataset (PubMedQA) from Hugging Face.
    PubMedQA is a large scale medical corpus with complex clinical context.
    """
    print("🚀 Downloading PubMedQA dataset (Proper medical text)...")
    try:
        from datasets import load_dataset
        
        # PubMedQA is highly stable and Parquet-native
        dataset = load_dataset("pubmed_qa", "pqa_labeled", split="train")
        
        formatted_samples = []
        for i in range(min(100, len(dataset))):
            context = " ".join(dataset[i]['context']['contexts'])
            question = dataset[i]['question']
            answer = dataset[i]['long_answer']
            formatted_samples.append({
                "text": f"CONTEXT: {context}\nQUESTION: {question}\nANSWER: {answer}",
                "type": "medical_qa_gold"
            })
            
        output_path = os.path.join(DATA_DIR, "pubmed_qa_samples.json")
        with open(output_path, "w") as f:
            json.dump(formatted_samples, f, indent=2)
            
        print(f"✅ Proper medical NLP dataset saved to: {output_path} (100 rich samples)")
        return output_path
        
    except Exception as e:
        print(f"⚠️ Hugging Face download failed: {e}")
        return None

if __name__ == "__main__":
    risk_path = download_risk_dataset()
    nlp_path = download_nlp_samples()
    print("\n--- Data Collection Complete ---")
    print(f"You can now use these datasets in your training scripts.")
