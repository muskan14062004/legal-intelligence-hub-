from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.vector_store import vector_store

router = APIRouter(prefix="/search", tags=["Semantic Search"])

@router.post("", response_model=SearchResponse)
def semantic_search(
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform natural language vector similarity search across contract clauses.
    Returns matched excerpts, page numbers, and similarity scores.
    """
    clean_query = req.query.strip()
    if not clean_query:
        return {"query": "", "total_results": 0, "results": []}

    matches = vector_store.search(
        query=clean_query,
        user_id=current_user.id,
        document_id=req.document_id,
        top_k=req.limit or 10
    )

    results = [
        SearchResultItem(
            chunk_id=m.get("chunk_id", ""),
            document_id=m.get("document_id", ""),
            document_title=m.get("document_title", ""),
            page_number=m.get("page_number", 1),
            excerpt=m.get("content", "")[:350],
            score=m.get("score", 0.0)
        )
        for m in matches
    ]

    return {
        "query": clean_query,
        "total_results": len(results),
        "results": results
    }
