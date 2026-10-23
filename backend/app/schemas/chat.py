from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CitationSchema(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    excerpt: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: List[CitationSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    title: str
    document_id: Optional[str] = None
    document_title: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    conversation_id: str
    message: MessageResponse
