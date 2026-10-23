from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.analysis import AnalysisFinding

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dynamic dashboard metrics for user:
    - total documents
    - documents awaiting processing
    - completed analyses
    - total queries/conversations
    - recently uploaded documents
    - recent activities
    """
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    total_docs = len(docs)
    pending_count = sum(1 for d in docs if d.status in ("pending", "processing"))
    completed_count = sum(1 for d in docs if d.status == "completed")
    error_count = sum(1 for d in docs if d.status == "error")

    total_conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).count()

    recent_docs = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).limit(5).all()

    # Build activity feed from recent documents and conversations
    activities = []
    for d in recent_docs:
        activities.append({
            "id": f"doc_{d.id}",
            "type": "upload",
            "title": f"Uploaded contract: {d.title}",
            "status": d.status,
            "timestamp": d.created_at
        })

    recent_convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).limit(5).all()

    for c in recent_convs:
        activities.append({
            "id": f"conv_{c.id}",
            "type": "chat",
            "title": f"Legal Research: {c.title}",
            "status": "completed",
            "timestamp": c.updated_at
        })

    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "total_documents": total_docs,
        "awaiting_processing": pending_count,
        "completed_analyses": completed_count,
        "error_documents": error_count,
        "total_conversations": total_conversations,
        "recent_documents": [
            {
                "id": d.id,
                "title": d.title,
                "filename": d.filename,
                "file_size": d.file_size,
                "page_count": d.page_count,
                "status": d.status,
                "created_at": d.created_at
            }
            for d in recent_docs
        ],
        "recent_activities": activities[:8]
    }
