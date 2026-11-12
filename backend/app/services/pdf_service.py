from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class PDFProcessingResult:
    def __init__(self, pages: List[Dict[str, Any]], page_count: int, is_scanned: bool, total_chars: int):
        self.pages = pages
        self.page_count = page_count
        self.is_scanned = is_scanned
        self.total_chars = total_chars

class PDFService:
    @staticmethod
    def extract_text_and_metadata(file_path: str) -> PDFProcessingResult:
        """
        Extract text from PDF preserving 1-based page numbers.
        Detects scanned PDFs with insufficient or empty extractable text.
        """
        import fitz

        doc = fitz.open(file_path)
        page_count = len(doc)
        pages_data = []
        total_chars = 0
        total_images = 0

        for idx, page in enumerate(doc):
            page_num = idx + 1
            text = page.get_text("text").strip()
            char_count = len(text)
            total_chars += char_count

            image_list = page.get_images()
            total_images += len(image_list)

            pages_data.append({
                "page_number": page_num,
                "text": text,
                "char_count": char_count
            })

        doc.close()

        is_scanned = False
        if page_count > 0:
            avg_chars_per_page = total_chars / page_count
            if total_chars < 60 or (avg_chars_per_page < 30 and total_images > 0):
                is_scanned = True

        return PDFProcessingResult(
            pages=pages_data,
            page_count=page_count,
            is_scanned=is_scanned,
            total_chars=total_chars
        )

    @staticmethod
    def get_page_text(file_path: str, page_number: int) -> Tuple[str, int]:
        """Get text of a specific page (1-based) along with total pages."""
        import fitz

        doc = fitz.open(file_path)
        total_pages = len(doc)
        if page_number < 1 or page_number > total_pages:
            doc.close()
            raise ValueError(f"Page number {page_number} is out of bounds (1 to {total_pages}).")

        page = doc[page_number - 1]
        text = page.get_text("text")
        doc.close()
        return text, total_pages

    @staticmethod
    def render_page_svg(file_path: str, page_number: int) -> str:
        """Render page as clean vector SVG for browser display."""
        import fitz

        doc = fitz.open(file_path)
        total_pages = len(doc)
        if page_number < 1 or page_number > total_pages:
            doc.close()
            raise ValueError(f"Page number {page_number} is out of bounds (1 to {total_pages}).")

        page = doc[page_number - 1]
        svg = page.get_svg_image()
        doc.close()
        return svg
