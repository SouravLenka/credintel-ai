"""
RAG Pipeline — Retrieval-Augmented Generation for financial document QA.

Given a user query and a ChromaDB collection, retrieves relevant chunks
and uses the LLM to generate a grounded answer.
"""
from __future__ import annotations

import asyncio
from typing import Any

from loguru import logger

from config import settings
from ai.embeddings import get_embedding_function


class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline over a ChromaDB collection.
    """

    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self._llm = None

    def _get_chroma_collection(self):
        import chromadb
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        return client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=get_embedding_function(),
        )

    def _get_llm(self):
        if self._llm is None:
            try:
                from langchain_groq import ChatGroq
                self._llm = ChatGroq(
                    model_name=settings.GROQ_MODEL,
                    api_key=settings.GROQ_API_KEY,
                    temperature=0.1,
                )
            except Exception as e:
                logger.warning(f"[RAG] Groq unavailable: {e}")
                self._llm = None
        return self._llm

    async def query(self, question: str, n_chunks: int = 5) -> dict[str, Any]:
        """
        Retrieve relevant chunks and generate an LLM answer.

        Returns:
            {
                "answer": str,
                "source_chunks": list[str],
                "model": str,
            }
        """
        # 1. Retrieve from ChromaDB
        try:
            collection = self._get_chroma_collection()
            results = collection.query(query_texts=[question], n_results=n_chunks)
            chunks: list[str] = results.get("documents", [[]])[0]
        except Exception as e:
            logger.error(f"[RAG] Retrieval failed: {e}")
            chunks = []

        if not chunks:
            return {
                "answer": "Insufficient document context available to answer this question.",
                "source_chunks": [],
                "model": "none",
            }

        context = "\n\n".join(f"[Chunk {i+1}]\n{c}" for i, c in enumerate(chunks))

        # 2. Generate answer via LLM
        llm = self._get_llm()
        if llm is None:
            return {
                "answer": f"[Mock] Based on documents: {chunks[0][:200]}...",
                "source_chunks": chunks,
                "model": "mock",
            }

        prompt = (
            "You are a financial analyst AI. Answer the following question "
            "using ONLY the provided document context. Be factual and concise.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )

        try:
            response = await asyncio.to_thread(llm.invoke, prompt)
            answer = response.content if hasattr(response, "content") else str(response)
            return {
                "answer": answer.strip(),
                "source_chunks": chunks,
                "model": settings.GROQ_MODEL,
            }
        except Exception as e:
            logger.error(f"[RAG] LLM generation failed: {e}")
            return {
                "answer": f"Error generating answer: {e}",
                "source_chunks": chunks,
                "model": settings.GROQ_MODEL,
            }

    async def extract_financial_summary(self) -> dict[str, str]:
        """
        Run pre-defined financial queries against the document collection.
        Returns a structured financial summary dict.
        """
        queries = {
            "revenue": "What is the total revenue or turnover of the company?",
            "profit": "What is the net profit or operating profit of the company?",
            "debt": "What is the total debt or borrowings of the company?",
            "cash_flow": "What is the operating cash flow or free cash flow?",
            "equity": "What is the shareholders equity or net worth?",
            "directors": "Who are the directors and promoters of the company?",
            "legal": "Are there any legal disputes, litigation, or regulatory notices?",
        }

        results = await asyncio.gather(
            *[self.query(q) for q in queries.values()],
            return_exceptions=True,
        )

        summary: dict[str, str] = {}
        for key, result in zip(queries.keys(), results):
            if isinstance(result, Exception):
                summary[key] = f"Error: {result}"
            else:
                summary[key] = result.get("answer", "N/A")  # type: ignore

        return summary
