import os
from typing import Dict, Any, List
from io import BytesIO
from loguru import logger

from .pdf_parser import parse_pdf
from .ocr_engine import process_image_or_scanned_pdf
from .table_extractor import extract_tables
from .data_normalizer import normalize_extracted_data

async def route_file_ingestion(file_bytes: bytes, filename: str, company_id: str) -> Dict[str, Any]:
    """
    Classifies the file and routes it to the correct parsing engine.
    """
    ext = os.path.splitext(filename)[1].lower()
    logger.info(f"[Ingestion] Routing {filename} (ext: {ext})")
    
    raw_text = ""
    metadata = {"filename": filename, "extension": ext}
    
    try:
        if ext == ".pdf":
            # Attempt digital PDF parsing first
            raw_text, is_scanned = await parse_pdf(file_bytes)
            if is_scanned:
                logger.info(f"[Ingestion] Digital parse failed for {filename}, falling back to OCR")
                raw_text = await process_image_or_scanned_pdf(file_bytes, is_pdf=True)
        
        elif ext in [".jpg", ".jpeg", ".png", ".bmp"]:
            raw_text = await process_image_or_scanned_pdf(file_bytes, is_pdf=False)
            
        elif ext in [".csv", ".xlsx", ".xls"]:
            # Excel/CSV handling usually returns structured data directly
            structured_data = await extract_tables(file_bytes, ext)
            raw_text = str(structured_data) # Simplified for storage
            metadata["structured_data"] = structured_data
            
        elif ext == ".docx":
            # Fallback text extraction for docx
            from docx import Document
            doc = Document(BytesIO(file_bytes))
            raw_text = "\n".join([p.text for p in doc.paragraphs])
            
        else:
            # Plain text fallback
            raw_text = file_bytes.decode("utf-8", errors="ignore")

        # Normalize the raw text into corporate fields using LLM or Regex (Step 4 & 5)
        # For now, return the raw data and metadata
        return {
            "text": raw_text,
            "metadata": metadata,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"[Ingestion] Error routing {filename}: {e}")
        return {
            "text": "",
            "metadata": metadata,
            "status": "error",
            "error": str(e)
        }
