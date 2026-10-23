from app.services.chunking_service import ChunkingService

def test_document_chunking_preserves_page_numbers():
    chunker = ChunkingService(chunk_size=300, chunk_overlap=50)

    sample_pages = [
        {"page_number": 1, "text": "Page 1 intro. Section 1. Scope of work. Paragraph explaining vendor deliverables and responsibilities."},
        {"page_number": 2, "text": "Page 2 content. Section 2. Indemnity terms. All claims and losses shall be covered by vendor."},
        {"page_number": 3, "text": "Page 3 content. Section 3. Governing Law in Delaware."}
    ]

    chunks = chunker.chunk_pages(sample_pages)

    assert len(chunks) >= 3
    # Ensure page numbers match correctly
    page_numbers = [c.page_number for c in chunks]
    assert 1 in page_numbers
    assert 2 in page_numbers
    assert 3 in page_numbers

    for c in chunks:
        assert c.content.strip() != ""
        assert c.chunk_index is not None
        assert isinstance(c.metadata, dict)

def test_chunking_overlap():
    chunker = ChunkingService(chunk_size=80, chunk_overlap=30)
    text = (
        "This is paragraph one of the legal contract.\n\n"
        "This is paragraph two containing crucial terms on dispute resolution.\n\n"
        "This is paragraph three discussing governing state laws."
    )
    pages = [{"page_number": 1, "text": text}]
    chunks = chunker.chunk_pages(pages)

    assert len(chunks) > 1
    for c in chunks:
        assert c.page_number == 1
