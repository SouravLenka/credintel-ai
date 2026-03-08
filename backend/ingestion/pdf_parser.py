import fitz  # PyMuPDF
from io import BytesIO
from typing import Tuple

async def parse_pdf(file_bytes: bytes) -> Tuple[str, bool]:
    """
    Parses a digital PDF using PyMuPDF.
    Returns (text, is_scanned_flag).
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    total_pages = len(doc)
    text_count = 0
    
    for page in doc:
        page_text = page.get_text()
        text += page_text
        text_count += len(page_text.strip())
        
    doc.close()
    
    # Lenient heuristic: if avg text per page is very low (<20 chars), it's likely scanned
    is_scanned = (text_count / total_pages < 20) if total_pages > 0 else True
    
    return text, is_scanned
