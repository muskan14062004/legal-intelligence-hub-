import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), default="application/pdf")
    page_count = Column(Integer, default=0)
    
    # Status: pending, processing, completed, error
    status = Column(String(50), default="pending", index=True)
    error_message = Column(Text, nullable=True)
    is_scanned = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    findings = relationship("AnalysisFinding", back_populates="document", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="document")
