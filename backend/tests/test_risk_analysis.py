from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.services.risk_analysis_service import RiskAnalysisService

def test_risk_analysis_evaluates_8_dimensions(db_session):
    # Create test document
    doc = Document(
        user_id="user-risk-test",
        title="Vendor Agreement",
        filename="vendor_agreement.pdf",
        file_path="/tmp/fake.pdf",
        file_size=1024,
        status="completed"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    # Add realistic contract chunks
    chunk1 = DocumentChunk(
        document_id=doc.id,
        chunk_index=0,
        page_number=1,
        content="Termination clause: Either party may terminate for convenience with 30 days notice."
    )
    chunk2 = DocumentChunk(
        document_id=doc.id,
        chunk_index=1,
        page_number=2,
        content="Vendor shall indemnify and hold harmless Client from all claims and losses."
    )
    chunk3 = DocumentChunk(
        document_id=doc.id,
        chunk_index=2,
        page_number=3,
        content="Limitation of liability: In no event shall liability exceed the fees paid in 12 months."
    )
    db_session.add_all([chunk1, chunk2, chunk3])
    db_session.commit()

    findings = RiskAnalysisService.analyze_document(db_session, doc)

    # Must contain 8 dimensions
    assert len(findings) == 8

    categories = [f.category for f in findings]
    assert "Termination Conditions" in categories
    assert "Indemnification Obligations" in categories
    assert "Liability Limitations" in categories
    assert "Governing Law & Jurisdiction" in categories
    assert "Missing or Unclear Provisions" in categories

    for f in findings:
        assert f.risk_level in ("Low", "Medium", "High")
        assert f.clause_title != ""
        assert f.explanation != ""
        assert f.suggested_questions is not None
