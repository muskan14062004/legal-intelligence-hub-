from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_size: int
    page_count: int
    status: str
    is_scanned: bool
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    total_chunks: int = 0
    total_findings: int = 0

class PageResponse(BaseModel):
    document_id: str
    page_number: int
    total_pages: int
    text: str
    has_text: bool
    svg_data: Optional[str] = None
