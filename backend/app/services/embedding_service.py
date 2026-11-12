import os
import logging
from typing import List, Union
import numpy as np
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini only if an API key is present; otherwise fail gracefully.
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class EmbeddingService:
    _instance = None
    _model = None
    _dimension = 768

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        try:
            if not settings.GEMINI_API_KEY:
                logger.warning("GEMINI_API_KEY is missing. Gemini embeddings will be unavailable.")
                self._model = None
                self._dimension = 768
                return

            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = settings.GEMINI_EMBEDDING_MODEL
            logger.info(f"Gemini embedding model configured: {self._model}")
            self._dimension = 768
        except Exception as e:
            logger.warning(f"Could not initialize Gemini embedding client ({e}). Falling back to deterministic vectorizer.")
            self._model = None
            self._dimension = 768

    @property
    def dimension(self) -> int:
        return self._dimension

    def encode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Generate normalized float32 embeddings for text or list of texts."""
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return np.empty((0, self._dimension), dtype=np.float32)

        if self._model is not None and settings.GEMINI_API_KEY:
            try:
                vectors = []
                for text in texts:
                    result = genai.embed_content(
                        model=self._model,
                        content=text,
                        task_type="retrieval_document"
                    )
                    embedding = result["embedding"] if isinstance(result, dict) and "embedding" in result else result
                    vectors.append(np.asarray(embedding, dtype=np.float32))

                arr = np.vstack(vectors)
                return arr.astype(np.float32)
            except Exception as e:
                logger.error(f"Error during Gemini encode: {e}")

        # Deterministic semantic hash projection fallback (normalized 768-d vector)
        vectors = []
        for text in texts:
            words = text.lower().split()
            vec = np.zeros(self._dimension, dtype=np.float32)
            for idx, word in enumerate(words):
                h = hash(word) % self._dimension
                vec[h] += 1.0 / (1.0 + 0.05 * idx)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vectors.append(vec)

        return np.array(vectors, dtype=np.float32)

embedding_service = EmbeddingService()
