import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    MessageResponse,
    ConversationResponse,
    CitationSchema
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["AI Document Chat"])

@router.post("", response_model=ChatResponse)
def send_chat_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a legal question across uploaded documents or a selected document.
    Executes RAG pipeline, returns answer with verifiable page citations.
    """
    conversation = None

    if req.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == req.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    else:
        # Generate short title from query
        clean_title = req.message[:50].strip()
        if len(req.message) > 50:
            clean_title += "..."

        conversation = Conversation(
            user_id=current_user.id,
            document_id=req.document_id,
            title=clean_title
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 1. Store User Message
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    # 2. Execute RAG Retrieval & Inference
    doc_id_scope = req.document_id or conversation.document_id
    answer_text, citations_list = rag_service.answer_question(
        query=req.message,
        user_id=current_user.id,
        document_id=doc_id_scope,
        top_k=5
    )

    # 3. Store Assistant Message with Structured Citations
    assistant_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=answer_text,
        citations_json=json.dumps(citations_list, ensure_ascii=False)
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    # Map citations
    typed_citations = [
        CitationSchema(
            document_id=c.get("document_id", ""),
            document_title=c.get("document_title", "Document"),
            page_number=c.get("page_number", 1),
            excerpt=c.get("excerpt", "")
        )
        for c in citations_list
    ]

    return {
        "conversation_id": conversation.id,
        "message": {
            "id": assistant_msg.id,
            "conversation_id": conversation.id,
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "citations": typed_citations,
            "created_at": assistant_msg.created_at
        }
    }

@router.get("/history", response_model=List[ConversationResponse])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all conversations for the authenticated user."""
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for c in convs:
        doc_title = None
        if c.document_id:
            d = db.query(Document).filter(Document.id == c.document_id).first()
            if d:
                doc_title = d.title

        msg_count = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).count()

        result.append({
            "id": c.id,
            "title": c.title,
            "document_id": c.document_id,
            "document_title": doc_title,
            "message_count": msg_count,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })

    return result

@router.get("/{conversation_id}", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a specific conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation.id
    ).order_by(ChatMessage.created_at.asc()).all()

    response = []
    for m in messages:
        citations = []
        if m.citations_json:
            try:
                raw_citations = json.loads(m.citations_json)
                citations = [
                    CitationSchema(
                        document_id=c.get("document_id", ""),
                        document_title=c.get("document_title", ""),
                        page_number=c.get("page_number", 1),
                        excerpt=c.get("excerpt", "")
                    )
                    for c in raw_citations
                ]
            except Exception:
                citations = []

        response.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role,
            "content": m.content,
            "citations": citations,
            "created_at": m.created_at
        })

    return response

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation and its messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    db.delete(conversation)
    db.commit()
    return None
