from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.auth import verify_firebase_token
from ai.research_agent import ResearchAgent


router = APIRouter(prefix="/api", tags=["Research"])
legacy_router = APIRouter(tags=["Research"])


class ResearchRequest(BaseModel):
    company_name: str


@router.post("/research")
async def run_research(
    payload: ResearchRequest,
    user: dict = Depends(verify_firebase_token),
):
    company_name = payload.company_name.strip()
    report = await ResearchAgent().research(company_name)
    return {
        "company": company_name,
        "research": report.to_dict(),
        "risk_flags": report.risk_flags,
        "pipeline": [
            "Company Name",
            "Search (SerpAPI or DDG fallback)",
            "Snippet aggregation",
            "LLM summarization",
            "Risk flag extraction",
        ],
    }


@legacy_router.post("/research")
async def run_research_legacy(
    payload: ResearchRequest,
    user: dict = Depends(verify_firebase_token),
):
    return await run_research(payload, user)
