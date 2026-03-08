from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.models import CompanyAnalysis, Company
from api.auth import verify_firebase_token
from loguru import logger
from sqlalchemy import select
from risk_engine.scoring import compile_decision_report
from risk_engine.validators import run_all_validators
from risk_engine.financial_metrics import evaluate_financial_metrics
from risk_engine.bank_analysis import evaluate_bank_metrics
from ai.research_agent import ResearchAgent

router = APIRouter(prefix="/api", tags=["Analyze"])

@router.post("/analyze")
async def analyze_company(
    analysis_id: str,
    user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Runs credit evaluation engine: Validation + Risk + Scoring + Research.
    """
    logger.info(f"[API] Running depth analysis for analysis_id: {analysis_id}")
    
    res = await db.execute(select(CompanyAnalysis).where(CompanyAnalysis.id == analysis_id))
    analysis = res.scalars().first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # 1. Run Web Research (Concurrent or Sequential)
    res_company = await db.execute(select(Company).where(Company.id == analysis.company_id))
    company = res_company.scalars().first()
    
    research_agent = ResearchAgent()
    report = await research_agent.research(company.name)
    analysis.research_data = report.to_dict()
    analysis.research_summary = report.news_summary

    # 2. Run Risk Engines
    # Prepare data dict for validators
    input_data = {
        "pan": analysis.pan,
        "gstin": analysis.gstin,
        "cin": analysis.cin,
        "entity_status": analysis.entity_status,
        "gstr1_revenue": analysis.gstr1_revenue,
        "gstr3b_revenue": analysis.gstr3b_revenue,
        "ebitda": analysis.ebitda,
        "long_term_debt": analysis.long_term_debt,
        "cheque_bounces": analysis.cheque_bounces,
        "ecs_returns": analysis.ecs_returns,
        "od_utilization_percent": analysis.od_utilization_percent,
        "nach_obligation_percent": analysis.nach_obligation_percent,
        "cibil_msme_rank": analysis.cibil_msme_rank,
    }

    v_flags = run_all_validators(input_data)
    f_flags, f_metrics = evaluate_financial_metrics(input_data)
    b_flags = evaluate_bank_metrics(input_data)
    
    # 3. Compile Final Decision
    decision_report = compile_decision_report(
        input_data,
        v_flags,
        f_flags,
        b_flags,
        f_metrics
    )

    # 4. Save to DB
    analysis.loan_decision = decision_report["loan_decision"]
    analysis.overall_credit_score = decision_report["credit_score"]
    analysis.risk_flags = decision_report["risk_flags"]
    analysis.score_breakdown = decision_report["score_breakdown"]
    analysis.status = "complete"
    
    await db.commit()

    return {
        "analysis_id": analysis.id,
        "company_id": analysis.company_id,
        "research": report.to_dict(),
        "score": {
            "loan_decision": decision_report["loan_decision"],
            "overall_credit_score": decision_report["credit_score"],
            "risk_flags": decision_report["risk_flags"],
            "score_breakdown": decision_report["score_breakdown"],
        },
        "loan_decision": decision_report["loan_decision"],
        "credit_score": decision_report["credit_score"],
        "risk_flags": decision_report["risk_flags"],
        "financial_metrics": decision_report["financial_metrics"],
        "score_breakdown": decision_report["score_breakdown"],
    }
