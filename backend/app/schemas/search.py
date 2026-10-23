from pydantic import BaseModel
from typing import Optional, List

class SearchRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    limit: int = 10

class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int
    excerpt: str
    score: float

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
