from app.services.rag_service import RAGService
from app.services.vector_store import VectorStore

def test_citation_extraction_format():
    response_text = (
        "According to [Master Services Agreement.pdf, Page 2], Vendor shall indemnify Client. "
        "Furthermore, under [Master Services Agreement.pdf, Page 3], either party may terminate for convenience."
    )
    mock_chunks = [
        {
            "document_id": "doc-123",
            "document_title": "Master Services Agreement.pdf",
            "page_number": 2,
            "excerpt": "Vendor shall indemnify, defend, and hold harmless..."
        },
        {
            "document_id": "doc-123",
            "document_title": "Master Services Agreement.pdf",
            "page_number": 3,
            "excerpt": "Either party may terminate this Agreement for convenience..."
        }
    ]

    citations = RAGService.extract_citations(response_text, mock_chunks)

    assert len(citations) == 2
    assert citations[0]["page_number"] == 2
    assert citations[0]["document_title"] == "Master Services Agreement.pdf"
    assert citations[1]["page_number"] == 3

def test_unsupported_question_handling():
    # When no chunks match or context is empty
    answer, citations = RAGService.answer_question(
        query="What is the penalty for violating maritime vessel emissions in Antwerp?",
        user_id="user-empty",
        document_id=None
    )

    assert "do not provide sufficient information" in answer.lower()
    assert citations == []

def test_vector_search_grounding(tmp_path):
    store = VectorStore(storage_dir=str(tmp_path / "vectors"))

    chunks = [
        {"chunk_id": "c1", "page_number": 1, "content": "The contract fees are due within 30 days of invoice."},
        {"chunk_id": "c2", "page_number": 2, "content": "Vendor indemnifies client against intellectual property infringement."},
        {"chunk_id": "c3", "page_number": 3, "content": "Termination for convenience requires 30 days prior written notice."}
    ]

    store.add_chunks(
        user_id="test-user",
        document_id="doc-abc",
        document_title="Sample Agreement.pdf",
        chunks=chunks
    )

    results = store.search("When can the contract be terminated?", user_id="test-user", top_k=1)
    assert len(results) == 1
    assert "termination" in results[0]["content"].lower()
    assert results[0]["page_number"] == 3
