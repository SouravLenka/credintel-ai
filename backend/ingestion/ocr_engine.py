from io import BytesIO
from PIL import Image
from loguru import logger

# Lazy imports to avoid heavy startup if not used
paddle_ocr = None
pytesseract = None

async def process_image_or_scanned_pdf(file_bytes: bytes, is_pdf: bool = False) -> str:
    """
    Extracts text from images or scanned PDFs using OCR.
    """
    global paddle_ocr, pytesseract
    
    # Load PaddleOCR only when needed
    if paddle_ocr is None:
        try:
            from paddleocr import PaddleOCR
            paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en')
        except Exception as e:
            logger.error(f"Failed to load PaddleOCR: {e}")

    try:
        # If PDF, convert first page to image for simple OCR implementation
        # (In production, you'd loop through all pages)
        if is_pdf:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc.load_page(0)
            pix = page.get_pixmap()
            img_data = pix.tobytes("png")
            doc.close()
        else:
            img_data = file_bytes

        # Convert image for OCR engines
        img = Image.open(BytesIO(img_data)).convert("RGB")
        
        # Try PaddleOCR
        if paddle_ocr:
            try:
                import numpy as np
                img_np = np.array(img)
                result = paddle_ocr.ocr(img_np, cls=True)
                text = []
                for line in result:
                    for word in line:
                        text.append(word[1][0])
                return " ".join(text)
            except Exception as e:
                logger.warning(f"PaddleOCR runtime fallback to Tesseract: {e}")
            
        # Fallback to Tesseract
        try:
            import pytesseract
            return pytesseract.image_to_string(img)
        except Exception:
            logger.warning("No OCR engine available (Paddle/Tesseract missing).")
            return ""

    except Exception as e:
        logger.error(f"OCR Error: {e}")
        return f"OCR processing failed: {str(e)}"
