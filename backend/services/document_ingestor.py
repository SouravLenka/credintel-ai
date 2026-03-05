"""
Document Ingestion Engine.

Handles:
  - Multi-format parsing (PDF, CSV, Excel, TXT)
  - Text chunking
  - Embedding creation via SentenceTransformers
  - Storage in ChromaDB
  - Structured financial signal extraction
"""
from __future__ import annotations

import io
import os
import uuid
from pathlib import Path
from typing import Any

import pandas as pd
from loguru import logger

from config import settings

# ── Lazy imports (heavy deps) ─────────────────────────────────────────────────

def _get_chroma_client():
    import chromadb
    return chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)


def _get_embedding_fn():
    from ai.embeddings import get_embedding_function
    return get_embedding_function()


# ─────────────────────────────────────────────────────────────────────────────

SUPPORTED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".txt"}

FINANCIAL_SIGNAL_KEYWORDS = {
    "revenue": ["revenue", "total revenue", "net revenue", "turnover"],
    "profit": ["net profit", "net income", "operating profit", "EBITDA", "PAT"],
    "debt": ["total debt", "long-term debt", "borrowings", "liabilities"],
    "cash_flow": ["cash flow", "operating cash", "free cash flow", "CFO"],
    "equity": ["shareholder equity", "net worth", "book value", "total equity"],
    "assets": ["total assets", "fixed assets", "current assets"],
    "legal": ["litigation", "dispute", "lawsuit", "notice", "penalty", "adjudication"],
    "directors": ["director", "promoter", "chairman", "managing director", "CEO", "CFO"],
}


class DocumentIngestor:
    """End-to-end document processing pipeline."""

    def __init__(self, company_id: str, collection_name: str | None = None):
        self.company_id = company_id
        self.collection_name = collection_name or f"company_{company_id}"
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

    # ── Public API ────────────────────────────────────────────────────────────

    async def ingest(self, file_bytes: bytes, filename: str) -> dict[str, Any]:
        """
        Full pipeline: save → parse → chunk → embed → store.
        Returns extracted signals and metadata.
        """
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        stored_path = self._save_file(file_bytes, filename)
        logger.info(f"[Ingestor] Saved {filename} → {stored_path}")

        text = self._parse(stored_path, ext, file_bytes)
        logger.info(f"[Ingestor] Extracted {len(text)} chars from {filename}")

        chunks = self._chunk_text(text)
        logger.info(f"[Ingestor] Created {len(chunks)} chunks")

        self._embed_and_store(chunks, filename)
        logger.info(f"[Ingestor] Embeddings stored in collection '{self.collection_name}'")

        signals = self._extract_signals(text)
        return {
            "stored_path": stored_path,
            "num_chunks": len(chunks),
            "signals": signals,
            "text_preview": text[:500],
        }

    def query(self, query_text: str, n_results: int = 5) -> list[str]:
        """RAG retrieval: return top-n relevant chunks for a query."""
        client = _get_chroma_client()
        collection = client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=_get_embedding_fn(),
        )
        results = collection.query(query_texts=[query_text], n_results=n_results)
        return results.get("documents", [[]])[0]

    # ── Private helpers ───────────────────────────────────────────────────────

    def _save_file(self, file_bytes: bytes, filename: str) -> str:
        uid = uuid.uuid4().hex[:8]
        safe_name = f"{uid}_{Path(filename).name}"
        dest = Path(settings.UPLOAD_DIR) / self.company_id / safe_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(file_bytes)
        return str(dest)

    def _parse(self, path: str, ext: str, raw_bytes: bytes) -> str:
        if ext == ".pdf":
            return self._parse_pdf(path)
        elif ext in (".csv",):
            return self._parse_csv(path)
        elif ext in (".xlsx", ".xls"):
            return self._parse_excel(path)
        elif ext == ".txt":
            return raw_bytes.decode("utf-8", errors="replace")
        return ""

    def _parse_pdf(self, path: str) -> str:
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(path)
            pages = [page.get_text() for page in doc]
            doc.close()
            return "\n".join(pages)
        except Exception as e:
            logger.warning(f"[Ingestor] PyMuPDF failed: {e}. Trying unstructured.")
            return self._parse_pdf_unstructured(path)

    def _parse_pdf_unstructured(self, path: str) -> str:
        try:
            from unstructured.partition.pdf import partition_pdf
            elements = partition_pdf(filename=path)
            return "\n".join(str(el) for el in elements)
        except Exception as e:
            logger.error(f"[Ingestor] Unstructured PDF parse failed: {e}")
            return ""

    def _parse_csv(self, path: str) -> str:
        try:
            df = pd.read_csv(path)
            return df.to_string(index=False)
        except Exception as e:
            logger.error(f"[Ingestor] CSV parse failed: {e}")
            return ""

    def _parse_excel(self, path: str) -> str:
        try:
            frames = pd.read_excel(path, sheet_name=None)
            texts = []
            for sheet, df in frames.items():
                texts.append(f"--- Sheet: {sheet} ---\n{df.to_string(index=False)}")
            return "\n\n".join(texts)
        except Exception as e:
            logger.error(f"[Ingestor] Excel parse failed: {e}")
            return ""

    def _chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
        """Simple sliding-window chunker."""
        words = text.split()
        chunks: list[str] = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunks.append(" ".join(words[start:end]))
            start += chunk_size - overlap
        return chunks

    def _embed_and_store(self, chunks: list[str], source: str) -> None:
        client = _get_chroma_client()
        collection = client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=_get_embedding_fn(),
        )
        ids = [f"{uuid.uuid4().hex}" for _ in chunks]
        metadatas = [{"source": source, "company_id": self.company_id} for _ in chunks]
        collection.add(documents=chunks, ids=ids, metadatas=metadatas)

    def _extract_signals(self, text: str) -> dict[str, Any]:
        """
        Rudimentary keyword-based signal extraction.
        Returns a dict of detected financial concepts.
        """
        text_lower = text.lower()
        signals: dict[str, Any] = {}
        for signal_name, keywords in FINANCIAL_SIGNAL_KEYWORDS.items():
            found = [kw for kw in keywords if kw.lower() in text_lower]
            signals[signal_name] = {
                "mentioned": len(found) > 0,
                "keywords_found": found,
            }
        return signals
