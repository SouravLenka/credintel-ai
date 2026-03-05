"""
CredIntel AI — FastAPI Application Entry Point.

Endpoints:
  POST /upload-documents
  POST /analyze-company
  POST /generate-report
  GET  /risk-score/{company_id}
  POST /auth/verify-token
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends, Security, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from pydantic import BaseModel

from config import settings
from db.database import init_db, get_db
from services.document_ingestor import DocumentIngestor
from services.research_agent import ResearchAgent
from services.risk_scoring import RiskScoringEngine
from services.cam_generator import CAMGenerator


# ─── App Initialization ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Corporate Credit Decision Engine",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated reports as static files
os.makedirs("./data/reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="./data/reports"), name="reports")


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    try:
        await init_db()
        logger.info("Database tables initialized.")
    except Exception as e:
        logger.warning(f"DB init skipped (no DB configured?): {e}")
    for d in ["./data/uploads", "./data/chroma", "./data/reports"]:
        os.makedirs(d, exist_ok=True)


# ─── Auth Helper ──────────────────────────────────────────────────────────────

async def verify_firebase_token(authorization: str = Header(default="")) -> dict:
    """
    Optional Firebase token verification.
    Returns user info if valid, raises 401 otherwise.
    Set FIREBASE_PROJECT_ID in .env to enable; otherwise returns a dev user.
    """
    if not settings.FIREBASE_PROJECT_ID:
        # Dev mode: skip auth
        return {"uid": "dev-user", "email": "dev@credintel.ai"}

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class AnalyzeCompanyRequest(BaseModel):
    company_name: str
    company_id: str
    include_research: bool = True
    include_rag: bool = True


class GenerateReportRequest(BaseModel):
    company_name: str
    company_id: str
    analysis_id: str
    research_data: dict[str, Any]
    score_data: dict[str, Any]
    financial_signals: Optional[dict[str, Any]] = None


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint for Railway/uptime monitoring."""
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ─── POST /upload-documents ───────────────────────────────────────────────────

@app.post("/upload-documents", tags=["Documents"])
async def upload_documents(
    company_name: str = Form(...),
    company_id: str = Form(default=""),
    files: list[UploadFile] = File(...),
    user: dict = Depends(verify_firebase_token),
):
    """
    Upload one or more financial documents for a company.
    Processes them through the ingestion pipeline and stores embeddings.
    """
    if not company_id:
        company_id = uuid.uuid4().hex

    results = []
    ingestor = DocumentIngestor(company_id=company_id)

    for file in files:
        try:
            file_bytes = await file.read()
            file_size_mb = len(file_bytes) / (1024 * 1024)
            if file_size_mb > settings.MAX_FILE_SIZE_MB:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": f"File too large ({file_size_mb:.1f} MB > {settings.MAX_FILE_SIZE_MB} MB limit)",
                })
                continue

            result = await ingestor.ingest(file_bytes, file.filename)
            results.append({
                "filename": file.filename,
                "status": "success",
                "stored_path": result["stored_path"],
                "num_chunks": result["num_chunks"],
                "signals": result["signals"],
            })
            logger.info(f"[API] Uploaded {file.filename} for {company_name}")
        except Exception as e:
            logger.error(f"[API] Upload error for {file.filename}: {e}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e),
            })

    return {
        "company_id": company_id,
        "company_name": company_name,
        "documents": results,
    }


# ─── POST /analyze-company ────────────────────────────────────────────────────

@app.post("/analyze-company", tags=["Analysis"])
async def analyze_company(
    request: AnalyzeCompanyRequest,
    user: dict = Depends(verify_firebase_token),
):
    """
    Run the full analysis pipeline:
      1. Research Agent (web research)
      2. RAG financial summary
      3. Risk Scoring (Five Cs)
    """
    analysis_id = uuid.uuid4().hex
    research_data: dict[str, Any] = {}
    rag_summary: dict[str, str] = {}
    rag_chunks: list[str] = []

    # Step 1: Research
    if request.include_research:
        try:
            agent = ResearchAgent()
            report = await agent.research(request.company_name)
            research_data = report.to_dict()
            logger.info(f"[API] Research complete for {request.company_name}")
        except Exception as e:
            logger.error(f"[API] Research failed: {e}")
            research_data = {"error": str(e), "risk_flags": []}

    # Step 2: RAG (document context)
    if request.include_rag:
        try:
            from ai.rag_pipeline import RAGPipeline
            collection_name = f"company_{request.company_id}"
            rag = RAGPipeline(collection_name)
            rag_summary = await rag.extract_financial_summary()
            rag_chunks = await _get_top_chunks(collection_name, request.company_name)
            logger.info(f"[API] RAG complete for {request.company_name}")
        except Exception as e:
            logger.warning(f"[API] RAG failed (documents not uploaded?): {e}")

    # Build aggregate signals from RAG + uploads
    combined_signals = _build_signals_from_rag(rag_summary)

    # Step 3: Risk scoring
    try:
        scorer = RiskScoringEngine()
        score = await scorer.score(
            company_name=request.company_name,
            extracted_signals=combined_signals,
            research_report=research_data,
            rag_context=rag_chunks,
        )
        score_data = score.to_dict()
    except Exception as e:
        logger.error(f"[API] Risk scoring failed: {e}")
        score_data = {"error": str(e)}

    return {
        "analysis_id": analysis_id,
        "company_id": request.company_id,
        "company_name": request.company_name,
        "research": research_data,
        "rag_summary": rag_summary,
        "score": score_data,
    }


# ─── POST /generate-report ──────────────────────────────────────────────────

@app.post("/generate-report", tags=["Reports"])
async def generate_report(
    request: GenerateReportRequest,
    user: dict = Depends(verify_firebase_token),
):
    """Generate a CAM report (PDF + DOCX) from analysis data."""
    try:
        generator = CAMGenerator()
        paths = generator.generate(
            company_name=request.company_name,
            analysis_id=request.analysis_id,
            research_data=request.research_data,
            score_data=request.score_data,
            financial_signals=request.financial_signals,
        )
        base_url = "/reports"
        return {
            "analysis_id": request.analysis_id,
            "pdf_url": f"{base_url}/{Path(paths['pdf_path']).name}",
            "docx_url": f"{base_url}/{Path(paths['docx_path']).name}",
            "pdf_path": paths["pdf_path"],
            "docx_path": paths["docx_path"],
        }
    except Exception as e:
        logger.error(f"[API] Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /risk-score/{company_id} ─────────────────────────────────────────────

@app.get("/risk-score/{company_id}", tags=["Analysis"])
async def get_risk_score(
    company_id: str,
    user: dict = Depends(verify_firebase_token),
):
    """
    Retrieve the last computed risk score for a company.
    In a full deployment this reads from PostgreSQL; here returns a live recalculation.
    """
    # For the prototype we re-query the ChromaDB collection
    try:
        collection_name = f"company_{company_id}"
        chunks = await _get_top_chunks(collection_name, "financial performance")
        signals = _build_signals_from_rag({})
        scorer = RiskScoringEngine()
        score = await scorer.score(
            company_name=f"Company-{company_id[:8]}",
            extracted_signals=signals,
            research_report={},
            rag_context=chunks,
        )
        return {"company_id": company_id, "score": score.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"No data found for company_id={company_id}: {e}")


# ─── POST /auth/verify-token ──────────────────────────────────────────────────

@app.post("/auth/verify-token", tags=["Auth"])
async def verify_token(user: dict = Depends(verify_firebase_token)):
    """Verify a Firebase ID token and return user info."""
    return {"valid": True, "user": user}


# ─── Helpers ──────────────────────────────────────────────────────────────────

# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_top_chunks(collection_name: str, query: str) -> list[str]:
    try:
        import chromadb
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        from ai.embeddings import get_embedding_function
        collection = client.get_or_create_collection(
            name=collection_name, embedding_function=get_embedding_function()
        )
        if collection.count() == 0:
            return []
        results = collection.query(query_texts=[query], n_results=min(5, collection.count()))
        return results.get("documents", [[]])[0]
    except Exception:
        return []


def _build_signals_from_rag(rag_summary: dict[str, str]) -> dict[str, Any]:
    """Convert RAG financial answers into signal format expected by risk scorer."""
    signals: dict[str, Any] = {}
    for key, answer in rag_summary.items():
        has_data = answer and "N/A" not in answer and "Error" not in answer
        signals[key] = {"mentioned": has_data, "rag_answer": answer}
    return signals


# ─── Main Block ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    import sys

    # Initialize Logging
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
    )
    
    # Railway provides the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=(settings.ENVIRONMENT == "development"),
        log_level=settings.LOG_LEVEL.lower(),
    )
