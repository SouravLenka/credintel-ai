FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc g++ libffi-dev libssl-dev \
    poppler-utils tesseract-ocr libgl1 \
    libmagic1 libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ .

# Create app runtime directories (match backend config defaults)
RUN mkdir -p /app/data/uploads /app/data/chroma /app/data/reports

ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]
