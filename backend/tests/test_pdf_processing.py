import pytest
from app.services.pdf_service import PDFService

def test_pdf_text_extraction_and_page_preservation(sample_pdf_path):
    result = PDFService.extract_text_and_metadata(sample_pdf_path)

    assert result.page_count == 3
    assert not result.is_scanned
    assert len(result.pages) == 3

    # Check page 1
    assert result.pages[0]["page_number"] == 1
    assert "MASTER SERVICES AGREEMENT" in result.pages[0]["text"]
    assert "Section 1. Scope of Services" in result.pages[0]["text"]

    # Check page 2
    assert result.pages[1]["page_number"] == 2
    assert "Section 4. Indemnification Obligations" in result.pages[1]["text"]

    # Check page 3
    assert result.pages[2]["page_number"] == 3
    assert "Section 5. Term and Termination" in result.pages[2]["text"]
    assert "State of Delaware" in result.pages[2]["text"]

def test_scanned_pdf_detection(scanned_pdf_path):
    result = PDFService.extract_text_and_metadata(scanned_pdf_path)
    assert result.is_scanned is True
    assert result.total_chars < 60

def test_get_page_text_bounds(sample_pdf_path):
    text, total = PDFService.get_page_text(sample_pdf_path, 2)
    assert total == 3
    assert "Indemnification" in text

    with pytest.raises(ValueError):
        PDFService.get_page_text(sample_pdf_path, 99)

def test_page_svg_rendering(sample_pdf_path):
    svg = PDFService.render_page_svg(sample_pdf_path, 1)
    assert "<svg" in svg
    assert "</svg>" in svg
