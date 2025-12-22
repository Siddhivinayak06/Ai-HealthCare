from fastapi import APIRouter, HTTPException
import pandas as pd
from src.schemas.models import RiskInput
from src.risk import get_risk_model, predict_patient_risk
from src.explainability.explanation import UnifiedExplainer

router = APIRouter(prefix="/predict", tags=["risk"])
risk_model = get_risk_model()

@router.post("/risk")
def predict_risk_endpoint(data: RiskInput, explain: bool = False):
    try:
        result = predict_patient_risk(risk_model, data)
        
        if explain:
            input_df = pd.DataFrame([data.dict()])
            explanation = UnifiedExplainer.explain_risk(risk_model, input_df)
            if explanation:
                result["explanation"] = explanation
                
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
