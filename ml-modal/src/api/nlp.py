from fastapi import APIRouter, HTTPException
import time
from src.schemas.models import NLPRequest, NLPResponse, NLPEntity
from src.nlp.report_parser import parse_clinical_report
from src.nlp.medical_ner import extract_medical_entities
from src.nlp.summarizer import get_doctor_patient_insight

router = APIRouter(prefix="/nlp", tags=["nlp"])

@router.post("/analyze", response_model=NLPResponse)
def analyze_report_endpoint(data: NLPRequest):
    start_time = time.time()
    try:
        text = ""
        if data.text:
            text = data.text
        elif data.file_path:
            # Assume file_path is relative to DATA_DIR or absolute
            text = parse_clinical_report(data.file_path)
        else:
            raise HTTPException(status_code=400, detail="Either 'text' or 'file_path' must be provided.")

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from the provided source.")

        # 1. Extract Entities (BioBERT)
        raw_entities = extract_medical_entities(text)
        
        entities = []
        if isinstance(raw_entities, dict):
            for cat, items in raw_entities.items():
                if isinstance(items, list):
                    for e in items:
                        entities.append(NLPEntity(
                            text=e["text"], 
                            label=e.get("raw_label", cat), 
                            confidence=e["confidence"]
                        ))

        # 2. Generate Insight (BART)
        from src.nlp.summarizer import generate_clinical_summary
        summary = generate_clinical_summary(text)
        insight = get_doctor_patient_insight(raw_entities, summary)

        return NLPResponse(
            summary=summary,
            entities=entities,
            doctor_insights=insight,
            processing_time=time.time() - start_time
        )
    except Exception as e:
        print(f"❌ NLP API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
