import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.analysis import AnalysisFinding
from app.schemas.analysis import RiskAnalysisResponse, FindingSchema
from app.services.risk_analysis_service import risk_analysis_service

router = APIRouter(prefix="/documents", tags=["Contract Risk Analysis"])

@router.post("/{document_id}/analyze", response_model=RiskAnalysisResponse)
def trigger_contract_analysis(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger automated risk analysis for the 8 key contract dimensions:
    Termination, Indemnity, Liability, Confidentiality, Payment, Renewal, Governing Law, and Boilerplate.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    findings = risk_analysis_service.analyze_document(db, doc)
    return format_analysis_response(doc, findings)

@router.get("/{document_id}/analysis", response_model=RiskAnalysisResponse)
def get_contract_analysis(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve stored risk analysis findings for a document.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    findings = db.query(AnalysisFinding).filter(
        AnalysisFinding.document_id == doc.id
    ).all()

    # If not yet analyzed and document is completed, run it on demand
    if not findings and doc.status == "completed":
        findings = risk_analysis_service.analyze_document(db, doc)

    return format_analysis_response(doc, findings)

def format_analysis_response(doc: Document, findings: List[AnalysisFinding]) -> RiskAnalysisResponse:
    high_count = sum(1 for f in findings if f.risk_level.lower() == "high")
    med_count = sum(1 for f in findings if f.risk_level.lower() == "medium")
    low_count = sum(1 for f in findings if f.risk_level.lower() == "low")

    finding_schemas = []
    for f in findings:
        questions = []
        if f.suggested_questions:
            try:
                questions = json.loads(f.suggested_questions)
            except Exception:
                questions = []

        finding_schemas.append(
            FindingSchema(
                id=f.id,
                category=f.category,
                clause_title=f.clause_title,
                extracted_text=f.extracted_text,
                page_number=f.page_number,
                explanation=f.explanation,
                risk_level=f.risk_level,
                suggested_questions=questions,
                created_at=f.created_at
            )
        )

    return RiskAnalysisResponse(
        document_id=doc.id,
        document_title=doc.title,
        total_findings=len(findings),
        high_risk_count=high_count,
        medium_risk_count=med_count,
        low_risk_count=low_count,
        findings=finding_schemas
    )
