from pydantic import BaseModel
from typing import List, Optional, Dict

class FeedbackRequest(BaseModel):
    image_id: str
    scan_type: str
    correct_label: str

class RetrainRequest(BaseModel):
    scan_type: str
    epochs: int = 5

class RiskInput(BaseModel):
    age: int
    bmi: float
    sys_bp: int
    dia_bp: int
    glucose: int
    cholesterol: int
    smoker: int

class DiagnosisResponse(BaseModel):
    id: str
    scan_type: str
    severity: str
    confidence: float
    findings: List[str]
    recommendations: List[str]
    processing_time: float
    explanation_url: Optional[str] = None
    explanation_text: Optional[str] = None
    modality_debug: Optional[Dict] = None
    auto_corrected: bool = False

class NLPRequest(BaseModel):
    text: Optional[str] = None
    file_path: Optional[str] = None

class NLPEntity(BaseModel):
    text: str
    label: str
    confidence: float

class NLPResponse(BaseModel):
    summary: str
    entities: List[NLPEntity]
    doctor_insights: Optional[Dict] = None
    processing_time: float
