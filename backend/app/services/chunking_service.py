import re
from typing import List, Dict, Any

class Chunk:
    def __init__(self, chunk_index: int, page_number: int, content: str, metadata: Dict[str, Any] = None):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.content = content
        self.metadata = metadata or {}

class ChunkingService:
    def __init__(self, chunk_size: int = 700, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_pages(self, pages: List[Dict[str, Any]]) -> List[Chunk]:
        """
        Takes page objects with page_number and text,
        produces overlapping chunks preserving exact page numbers.
        """
        chunks: List[Chunk] = []
        global_chunk_idx = 0

        for p in pages:
            page_num = p["page_number"]
            text = p["text"].strip()
            if not text:
                continue

            # Identify candidate section headers in the page text
            section_matches = re.findall(
                r'(?:Section\s+\d+|Article\s+[IVXLCDM\d]+|\b\d+\.\d+\b|\bCLAUSE\s+\d+)\s+([A-Za-z\s]+)',
                text,
                re.IGNORECASE
            )
            detected_section = section_matches[0].strip() if section_matches else None

            # Split by double newline (paragraphs) first
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [text]

            current_chunk_text = ""
            current_start_char = 0

            for para in paragraphs:
                # If adding this paragraph exceeds chunk size and we already have content:
                if len(current_chunk_text) + len(para) > self.chunk_size and current_chunk_text:
                    chunks.append(Chunk(
                        chunk_index=global_chunk_idx,
                        page_number=page_num,
                        content=current_chunk_text.strip(),
                        metadata={
                            "section": detected_section,
                            "char_length": len(current_chunk_text)
                        }
                    ))
                    global_chunk_idx += 1

                    # Create overlap from end of current chunk
                    if self.chunk_overlap > 0 and len(current_chunk_text) > self.chunk_overlap:
                        overlap_text = current_chunk_text[-self.chunk_overlap:]
                        # Try to start after a whitespace
                        space_idx = overlap_text.find(" ")
                        if space_idx != -1:
                            overlap_text = overlap_text[space_idx + 1:]
                        current_chunk_text = overlap_text + " " + para
                    else:
                        current_chunk_text = para
                else:
                    if current_chunk_text:
                        current_chunk_text += "\n\n" + para
                    else:
                        current_chunk_text = para

            # Remaining text on this page
            if current_chunk_text.strip():
                chunks.append(Chunk(
                    chunk_index=global_chunk_idx,
                    page_number=page_num,
                    content=current_chunk_text.strip(),
                    metadata={
                        "section": detected_section,
                        "char_length": len(current_chunk_text)
                    }
                ))
                global_chunk_idx += 1

        return chunks
