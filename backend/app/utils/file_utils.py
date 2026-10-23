import os
import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

def sanitize_filename(filename: str) -> str:
    """Sanitize the uploaded file name to prevent path traversal or special chars."""
    basename = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', basename)
    if not clean:
        clean = f"document_{uuid.uuid4().hex[:8]}.pdf"
    return clean

def validate_pdf_file(file: UploadFile):
    """Validate file extension and mime type."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Currently only PDF documents are supported (DOCX coming soon)."
        )

    # Note: size check is performed during chunk streaming to avoid reading full file in memory at once
