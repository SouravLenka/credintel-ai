"""
SQLAlchemy ORM models for CredIntel AI.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, ForeignKey,
    Integer, JSON, String, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    firebase_uid: str = Column(String(128), unique=True, nullable=False, index=True)
    email: str = Column(String(255), unique=True, nullable=False)
    display_name: Optional[str] = Column(String(255))
    photo_url: Optional[str] = Column(Text)
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(DateTime(timezone=True), onupdate=func.now())

    analyses = relationship("CompanyAnalysis", back_populates="user", cascade="all, delete-orphan")


# ─── Company ─────────────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name: str = Column(String(255), nullable=False, index=True)
    industry: Optional[str] = Column(String(255))
    description: Optional[str] = Column(Text)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document", back_populates="company", cascade="all, delete-orphan")
    analyses = relationship("CompanyAnalysis", back_populates="company", cascade="all, delete-orphan")


# ─── Document ────────────────────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    company_id: str = Column(UUID(as_uuid=False), ForeignKey("companies.id"), nullable=False)
    original_filename: str = Column(String(512), nullable=False)
    stored_path: str = Column(Text, nullable=False)
    doc_type: str = Column(String(50))          # pdf | csv | xlsx | txt
    file_size_bytes: int = Column(BigInteger)
    status: str = Column(String(50), default="pending")  # pending | processing | indexed | error
    error_message: Optional[str] = Column(Text)
    chroma_collection_id: Optional[str] = Column(String(255))
    extracted_signals: Optional[dict] = Column(JSON)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="documents")


# ─── Company Analysis ────────────────────────────────────────────────────────

class CompanyAnalysis(Base):
    __tablename__ = "company_analyses"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    company_id: str = Column(UUID(as_uuid=False), ForeignKey("companies.id"), nullable=False)
    user_id: str = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    # Research results
    research_summary: Optional[str] = Column(Text)
    research_data: Optional[dict] = Column(JSON)

    # Risk score
    character_score: Optional[float] = Column(Float)
    capacity_score: Optional[float] = Column(Float)
    capital_score: Optional[float] = Column(Float)
    collateral_score: Optional[float] = Column(Float)
    conditions_score: Optional[float] = Column(Float)
    overall_credit_score: Optional[float] = Column(Float)
    risk_category: Optional[str] = Column(String(20))   # Low | Medium | High
    score_breakdown: Optional[dict] = Column(JSON)

    # CAM report
    cam_pdf_path: Optional[str] = Column(Text)
    cam_docx_path: Optional[str] = Column(Text)

    status: str = Column(String(50), default="pending")  # pending | analyzing | complete | error
    error_message: Optional[str] = Column(Text)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: datetime = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="analyses")
    user = relationship("User", back_populates="analyses")
