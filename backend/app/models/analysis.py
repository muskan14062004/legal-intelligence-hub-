import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnalysisFinding(Base):
    __tablename__ = "analysis_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    clause_title = Column(String(255), nullable=False)
    extracted_text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    risk_level = Column(String(20), nullable=False)  # Low, Medium, High
    suggested_questions = Column(Text, nullable=True)  # JSON-encoded array of questions
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="findings")
