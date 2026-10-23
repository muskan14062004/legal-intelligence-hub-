import os
import json
import faiss
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = storage_dir or str(settings.VECTOR_STORE_DIR)
        os.makedirs(self.storage_dir, exist_ok=True)
        self.index_path = os.path.join(self.storage_dir, "faiss_index.bin")
        self.metadata_path = os.path.join(self.storage_dir, "metadata.json")
        self.dimension = embedding_service.dimension

        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        """Load index and metadata from disk if they exist, or create new."""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors.")
                return
            except Exception as e:
                logger.error(f"Failed to load existing FAISS index: {e}. Reinitializing.")

        # Create IndexFlatIP (Inner Product for normalized vectors = cosine similarity)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []

    def _save(self):
        """Save FAISS index and metadata to disk."""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def add_chunks(
        self,
        user_id: str,
        document_id: str,
        document_title: str,
        chunks: List[Dict[str, Any]]
    ):
        """
        chunks: List of {"chunk_id": str, "page_number": int, "content": str}
        """
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        vectors = embedding_service.encode(texts)

        # Add to FAISS
        self.index.add(vectors)

        # Store corresponding metadata
        for idx, c in enumerate(chunks):
            self.metadata.append({
                "user_id": user_id,
                "document_id": document_id,
                "document_title": document_title,
                "chunk_id": c.get("chunk_id", ""),
                "page_number": c.get("page_number", 1),
                "excerpt": c["content"][:300],  # preview excerpt
                "content": c["content"]
            })

        self._save()
        logger.info(f"Added {len(chunks)} chunks to vector index for document {document_id}.")

    def search(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for most relevant chunks matching query, scoped to user and optional document.
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        query_vec = embedding_service.encode([query])

        # Retrieve a candidate pool larger than top_k to allow user/document filtering
        candidate_k = min(self.index.ntotal, max(top_k * 5, 25))
        scores, indices = self.index.search(query_vec, candidate_k)

        results = []
        scores = scores[0]
        indices = indices[0]

        for score, idx in zip(scores, indices):
            if idx < 0 or idx >= len(self.metadata):
                continue

            meta = self.metadata[idx]

            # Security: enforce user ownership check
            if meta.get("user_id") != user_id:
                continue

            # Scope to specific document if specified
            if document_id and meta.get("document_id") != document_id:
                continue

            # Format similarity score (bounded between 0.0 and 1.0)
            norm_score = max(0.0, min(1.0, float(score)))

            results.append({
                "chunk_id": meta.get("chunk_id"),
                "document_id": meta.get("document_id"),
                "document_title": meta.get("document_title"),
                "page_number": meta.get("page_number"),
                "excerpt": meta.get("excerpt"),
                "content": meta.get("content"),
                "score": round(norm_score, 4)
            })

            if len(results) >= top_k:
                break

        return results

    def delete_document(self, document_id: str):
        """Remove all vectors associated with a document and re-index."""
        if not self.metadata:
            return

        new_metadata = []
        keep_indices = []

        for idx, meta in enumerate(self.metadata):
            if meta.get("document_id") != document_id:
                new_metadata.append(meta)
                keep_indices.append(idx)

        if len(keep_indices) == len(self.metadata):
            return  # No vectors for this doc

        # Rebuild FAISS index with remaining vectors
        new_index = faiss.IndexFlatIP(self.dimension)
        if keep_indices:
            # Re-encode content or reconstruct
            texts = [m["content"] for m in new_metadata]
            vectors = embedding_service.encode(texts)
            new_index.add(vectors)

        self.index = new_index
        self.metadata = new_metadata
        self._save()
        logger.info(f"Deleted vectors for document {document_id}. New index size: {self.index.ntotal}.")

vector_store = VectorStore()
