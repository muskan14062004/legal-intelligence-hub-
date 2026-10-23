import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.analysis import AnalysisFinding
from app.schemas.document import DocumentResponse, DocumentDetailResponse, PageResponse
from app.utils.file_utils import sanitize_filename, validate_pdf_file
from app.services.pdf_service import PDFService
from app.services.chunking_service import ChunkingService
from app.services.vector_store import vector_store
from app.services.risk_analysis_service import risk_analysis_service

router = APIRouter(prefix="/documents", tags=["Documents"])

def process_document_pipeline(document_id: str):
    """
    Background worker to extract text, chunk, embed, and index document.
    """
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        doc.status = "processing"
        db.commit()

        # Step 1 & 2: PyMuPDF Extraction & Scanned Detection
        res = PDFService.extract_text_and_metadata(doc.file_path)
        doc.page_count = res.page_count
        doc.is_scanned = res.is_scanned

        if res.is_scanned:
            doc.status = "error"
            doc.error_message = (
                "Scanned PDF detected with no extractable text. "
                "OCR support is not currently enabled. Please upload a searchable or digital PDF."
            )
            db.commit()
            return

        # Step 3 & 4: Chunking
        chunker = ChunkingService(chunk_size=700, chunk_overlap=150)
        chunks = chunker.chunk_pages(res.pages)

        if not chunks:
            doc.status = "error"
            doc.error_message = "No extractable text chunks could be produced from this document."
            db.commit()
            return

        # Step 5: Save chunks in DB
        db_chunks = []
        vector_chunk_payload = []
        for c in chunks:
            chunk_record = DocumentChunk(
                document_id=doc.id,
                chunk_index=c.chunk_index,
                page_number=c.page_number,
                content=c.content
            )
            db.add(chunk_record)
            db_chunks.append(chunk_record)

        db.commit()

        for c in db_chunks:
            db.refresh(c)
            vector_chunk_payload.append({
                "chunk_id": c.id,
                "page_number": c.page_number,
                "content": c.content
            })

        # Step 6: Vector Indexing
        vector_store.add_chunks(
            user_id=doc.user_id,
            document_id=doc.id,
            document_title=doc.title,
            chunks=vector_chunk_payload
        )

        # Step 7: Auto-run Contract Risk Analysis
        risk_analysis_service.analyze_document(db, doc)

        doc.status = "completed"
        doc.error_message = None
        db.commit()

    except Exception as e:
        db.rollback()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            doc.error_message = f"Processing error: {str(e)}"
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and schedule processing for a legal PDF document."""
    validate_pdf_file(file)

    clean_name = sanitize_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{clean_name}"
    saved_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Stream file to disk and enforce max size
    file_size = 0
    with open(saved_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)  # 1MB chunk
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
                buffer.close()
                if os.path.exists(saved_path):
                    os.remove(saved_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
                )
            buffer.write(chunk)

    # Derive document title from original filename
    title = os.path.splitext(file.filename)[0].replace("_", " ").title()

    document = Document(
        user_id=current_user.id,
        title=title,
        filename=file.filename,
        file_path=saved_path,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        status="pending"
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Run processing pipeline immediately (or in background)
    background_tasks.add_task(process_document_pipeline, document.id)

    return document

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all documents owned by the current user."""
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))
    return query.order_by(Document.created_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document details, chunk count, and finding count."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    total_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
    total_findings = db.query(AnalysisFinding).filter(AnalysisFinding.document_id == doc.id).count()

    return {
        "id": doc.id,
        "title": doc.title,
        "filename": doc.filename,
        "file_size": doc.file_size,
        "page_count": doc.page_count,
        "status": doc.status,
        "is_scanned": doc.is_scanned,
        "error_message": doc.error_message,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "total_chunks": total_chunks,
        "total_findings": total_findings
    }

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document, its database records, file from disk, and vector index."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove vector index entries
    vector_store.delete_document(doc.id)

    # Remove physical file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return None

@router.get("/{document_id}/pages/{page_number}", response_model=PageResponse)
def get_document_page(
    document_id: str,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve text and vector SVG render of a specific PDF page."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file missing from storage.")

    try:
        text, total_pages = PDFService.get_page_text(doc.file_path, page_number)
        svg_content = PDFService.render_page_svg(doc.file_path, page_number)

        return {
            "document_id": doc.id,
            "page_number": page_number,
            "total_pages": total_pages,
            "text": text,
            "has_text": bool(text.strip()),
            "svg_data": svg_content
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{document_id}/file")
def get_raw_pdf_file(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream original PDF for in-browser PDF viewers."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found.")

    return FileResponse(
        doc.file_path,
        media_type="application/pdf",
        filename=doc.filename
    )
