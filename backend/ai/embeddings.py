"""
Sentence Transformer Embedding Function adapter for ChromaDB.
"""
from __future__ import annotations

from typing import List
from loguru import logger

from config import settings

# ChromaDB's EmbeddingFunction protocol
try:
    from chromadb import EmbeddingFunction, Documents, Embeddings
except ImportError:
    EmbeddingFunction = object
    Documents = list
    Embeddings = list

_embedding_fn = None


class SentenceTransformerEmbeddingFn(EmbeddingFunction):  # type: ignore[misc]
    """Wraps sentence-transformers for ChromaDB compatibility."""

    MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self):
        logger.info(f"[Embeddings] Loading model: {self.MODEL_NAME}")
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(self.MODEL_NAME)

    def __call__(self, input: Documents) -> Embeddings:  # noqa: A002
        embeddings = self.model.encode(list(input), show_progress_bar=False)
        return embeddings.tolist()


def get_embedding_function() -> SentenceTransformerEmbeddingFn:
    """Return a singleton embedding function instance."""
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = SentenceTransformerEmbeddingFn()
    return _embedding_fn


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Utility: embed a list of texts and return vectors."""
    fn = get_embedding_function()
    return fn(texts)
