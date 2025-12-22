import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import torch

# Load specialized medical NER models
# In a real environment, we'd use 'en_core_sci_md' from scispacy
# Here we'll use a BioBERT-based pipeline from HuggingFace
try:
    NER_PIPELINE = pipeline(
        "ner", 
        model="d4data/biomedical-ner-all", 
        tokenizer="d4data/biomedical-ner-all",
        aggregation_strategy="simple"
    )
except Exception as e:
    print(f"⚠️ Failed to load BioBERT NER: {e}")
    NER_PIPELINE = None

def extract_medical_entities(text):
    """
    Identifies diseases, drugs, procedures, and anatomical sites from text.
    """
    if not NER_PIPELINE:
        return {"error": "Medical NER model not available"}
        
    try:
        results = NER_PIPELINE(text)
        structured_entities = {
            "DISEASES": [],
            "DRUGS": [],
            "LABS": [],
            "ANATOMY": []
        }
        
        # Comprehensive mapping for biomedical clinical entities
        label_map = {
            "Diagnostic_procedure": "LABS",
            "Disease_disorder": "DISEASES",
            "Dosage": "DRUGS",
            "Medication": "DRUGS",
            "Sign_or_Symptom": "DISEASES",
            "Body_part": "ANATOMY",
            "Lab_value": "LABS",
            "Therapeutic_procedure": "LABS"
        }
        
        for ent in results:
            raw_label = ent['entity_group']
            category = label_map.get(raw_label, "OTHER")
            
            if category in structured_entities:
                item = {
                    "text": ent['word'],
                    "confidence": float(ent['score']),
                    "start": ent['start'],
                    "end": ent['end'],
                    "raw_label": raw_label
                }
                # Avoid duplicates and filter low confidence
                if item["confidence"] > 0.4 and item["text"] not in [x["text"] for x in structured_entities[category]]:
                    structured_entities[category].append(item)
                    
        return structured_entities
    except Exception as e:
        print(f"❌ Medical NER Error: {e}")
        return {"error": str(e)}
