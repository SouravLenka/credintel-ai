import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header, Form
from config import settings
from database.db import get_db
from database.models import Company, Document
from sqlalchemy.ext.asyncio import AsyncSession
# router = APIRouter(...)
from loguru import logger

# Define the dependency function here, or import it from a new auth module
# For this specific edit, we'll define it locally as per the provided snippet's intent
async def verify_firebase_token_dependency(authorization: str = Header(default="")):
    # This assumes 'main' is accessible or that verify_firebase_token is moved/mocked
    # As per the instruction, the original verify_firebase_token is in 'main'
    from api.auth import verify_firebase_token as original_verify_firebase_token
    return await original_verify_firebase_token(authorization)

router = APIRouter(prefix="/api", tags=["Upload"])

@router.post("/upload")
async def upload_documents(
    company_name: str = Form(...),
    files: List[UploadFile] = File(...),
    user: dict = Depends(verify_firebase_token_dependency), # Use the new dependency function
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads multiple files for a company.
    """
    logger.info(f"[API] Uploading {len(files)} files for company: {company_name}")
    
    # Simple check/create company
    from sqlalchemy import select
    res = await db.execute(select(Company).where(Company.name == company_name))
    company = res.scalars().first()
    
    if not company:
        company = Company(name=company_name)
        db.add(company)
        await db.flush()

    stored_files = []
    upload_dir = os.path.join(settings.UPLOAD_DIR, company.id)
    os.makedirs(upload_dir, exist_ok=True)

    for file in files:
        stored_path = os.path.join(upload_dir, f"{uuid.uuid4().hex[:8]}_{file.filename}")
        content = await file.read()
        with open(stored_path, "wb") as f:
            f.write(content)
        
        doc = Document(
            company_id=company.id,
            original_filename=file.filename,
            stored_path=stored_path,
            doc_type=file.filename.split('.')[-1],
            file_size_bytes=len(content),
            status="pending"
        )
        db.add(doc)
        stored_files.append({"filename": file.filename, "status": "success"})

    await db.commit()
    return {
        "company_id": company.id,
        "company_name": company.name,
        "documents": stored_files
    }
