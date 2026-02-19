from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import os
import re

try:
    # 2. Clinical Reasoning Model (Fine-tuned on PubMedQA)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    NLP_MODEL_PATH = os.path.join(BASE_DIR, "models/nlp_custom")
    
    if os.path.exists(NLP_MODEL_PATH):
        print(f"🧠 Loading fine-tuned clinical model from: {NLP_MODEL_PATH}")
        tokenizer = AutoTokenizer.from_pretrained(NLP_MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(NLP_MODEL_PATH)
        # Use CPU to avoid pipeline overhead/MPS issues during verification
        REASONER = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer, device=-1)
        print("✅ REASONER loaded successfully.")
    else:
        print(f"⚠️ NLP model path not found: {NLP_MODEL_PATH}")
        REASONER = None
except Exception as e:
    import traceback
    print(f"❌ Failed to load NLP components: {str(e)}")
    traceback.print_exc()
    REASONER = None

def generate_clinical_summary(text):
    """
    Extractive summarizer: Uses the fine-tuned model to identify the most clinically 
    significant sentences from the input text.
    """
    results = {
        "summary": "Clinical analysis complete.",
        "reasoning_label": "Unknown",
        "reasoning_confidence": 0.0
    }

    if not REASONER:
        results["summary"] = text[:200] + "..."
        return results
        
    try:
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentence_scores = []
        
        # PubMedQA Conclusion Mapping
        label_map = {"LABEL_0": "Negative Correlation", "LABEL_1": "Positive Correlation", "LABEL_2": "Inconclusive"}

        # Score sentences based on reasoning confidence
        for sent in sentences:
            if len(sent.split()) < 5: continue
            inf = REASONER(sent[:512])[0]
            sentence_scores.append((sent, inf['score'], inf['label']))
        
        # Sort by confidence and take top 3
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:3]
        results["summary"] = " ".join([x[0] for x in top_sentences])
        
        # Overall reasoning from the whole text (or first 512 chars)
        overall = REASONER(text[:512])[0]
        results["reasoning_label"] = label_map.get(overall['label'], "Analysis Complete")
        results["reasoning_confidence"] = float(overall['score'])
            
        return results
    except Exception as e:
        print(f"❌ NLP Analysis Error: {e}")
        return results

def get_doctor_patient_insight(entities, summary_results):
    """
    Combines NER and Summary results into a unified insight object.
    """
    diseases = list(set([d['text'] for d in entities.get('DISEASES', [])]))
    drugs = list(set([d['text'] for d in entities.get('DRUGS', [])]))
    labs = list(set([l['text'] for l in entities.get('LABS', [])]))
    
    insight = {
        "patient_summary": summary_results["summary"],
        "clinical_reasoning": {
            "conclusion": summary_results["reasoning_label"],
            "confidence": summary_results["reasoning_confidence"]
        },
        "clinical_findings": {
            "conditions_detected": diseases,
            "medications_noted": drugs,
            "lab_tests_mentioned": labs
        },
        "doctor_brief": f"Conclusion: {summary_results['reasoning_label']} ({summary_results['reasoning_confidence']:.2f}). Detected {len(diseases)} conditions.",
        "action_required": "Review extraction confidence and clinical correlations."
    }
    return insight
