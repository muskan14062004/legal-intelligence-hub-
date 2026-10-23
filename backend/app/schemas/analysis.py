from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FindingSchema(BaseModel):
    id: str
    category: str
    clause_title: str
    extracted_text: str
    page_number: int
    explanation: str
    risk_level: str  # Low, Medium, High
    suggested_questions: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class RiskAnalysisResponse(BaseModel):
    document_id: str
    document_title: str
    total_findings: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    findings: List[FindingSchema]
    disclaimer: str = (
        "Preliminary AI assessment for review purposes only. "
        "Not a substitute for qualified legal counsel or formal legal advice."
    )
