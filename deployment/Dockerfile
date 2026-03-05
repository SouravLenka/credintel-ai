# ── Backend ──────────────────────────────────────────────────
FROM python:3.11-slim as backend-base

WORKDIR /app

# Install system deps for pyMuPDF, unstructured
RUN apt-get update && apt-get install -y \
    gcc g++ libffi-dev libssl-dev \
    poppler-utils tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Create data directories
RUN mkdir -p data/uploads data/chroma data/reports

EXPOSE 8000

# Use gunicorn in production, uvicorn in dev
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
