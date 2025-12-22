from transformers import pipeline

try:
    # Use a medical summarization model or a general-purpose one fine-tuned for health
    SUMMARIZER = pipeline("summarization", model="facebook/bart-large-cnn")
except Exception as e:
    print(f"⚠️ Failed to load summarizer: {e}")
    SUMMARIZER = None

def generate_clinical_summary(text):
    """
    Generates a patient-friendly summary from complex clinical notes.
    """
    if not SUMMARIZER:
        return text[:200] + "..." # Fallback to truncation
        
    try:
        # Constraint lengths for doctor-patient communication
        max_l = min(150, len(text.split()) // 2)
        min_l = min(30, max_l // 2)
        
        summary = SUMMARIZER(text, max_length=max_l, min_length=min_l, do_sample=False)
        return summary[0]['summary_text']
    except Exception as e:
        print(f"❌ Summarization Error: {e}")
        return "Summary unavailable at this time."

def get_doctor_patient_insight(entities, summary):
    """
    Combines NER and Summary into a unified insight object for clinical decision support.
    """
    diseases = list(set([d['text'] for d in entities.get('DISEASES', [])]))
    drugs = list(set([d['text'] for d in entities.get('DRUGS', [])]))
    labs = list(set([l['text'] for l in entities.get('LABS', [])]))
    
    insight = {
        "patient_summary": summary,
        "clinical_findings": {
            "conditions_detected": diseases,
            "medications_noted": drugs,
            "lab_tests_mentioned": labs
        },
        "doctor_brief": f"Detected {len(diseases)} potential conditions and {len(drugs)} medications. Summary provided for patient readability.",
        "action_required": "Correlate NLP findings with SHAP risk factors for holistic assessment."
    }
    return insight
