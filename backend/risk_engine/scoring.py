from typing import Dict, Any, List

# Example Five C's weighting schema
# Financial Strength (DSCR, EBITDA, Capital) -> 30%
# Bank Behavior (Bounces, OD) -> 20%
# Tax Compliance (GST Variance) -> 20%
# Credit Bureau (CIBIL) -> 15%
# Qualitative (Promoter experience, Entity status) -> 15%

def compute_detailed_scores(extracted_data: Dict[str, Any], all_flags: List[str]) -> Dict[str, Any]:
    """
    Computes a mock score breakdown based on Five Cs metrics and present flags.
    In a real implementation, this would look at specific data points dynamically. 
    Here we apply a basic penalty system driven by the generated risk flags.
    """
    base_score = 100.0
    
    financial_penalty = sum([15 for f in all_flags if "DSCR" in f or "Inventory" in f])
    bank_penalty = sum([10 for f in all_flags if "Cheque" in f or "ECS" in f or "OD" in f or "NACH" in f])
    tax_penalty = sum([15 for f in all_flags if "GST variance" in f])
    bureau_penalty = sum([15 for f in all_flags if "CIBIL" in f])
    qualitative_penalty = sum([10 for f in all_flags if "PAN" in f or "GSTIN" in f or "CIN" in f or "Entity" in f])

    # Category subtotals based on max weights
    financial_score = max(0, 30.0 - financial_penalty)
    bank_score = max(0, 20.0 - bank_penalty)
    tax_score = max(0, 20.0 - tax_penalty)
    bureau_score = max(0, 15.0 - bureau_penalty)
    qualitative_score = max(0, 15.0 - qualitative_penalty)
    
    total = financial_score + bank_score + tax_score + bureau_score + qualitative_score
    
    return {
        "overall": round(total, 2),
        "breakdown": {
            "financial_strength": round(financial_score, 2),  # out of 30
            "bank_behavior": round(bank_score, 2),            # out of 20
            "tax_compliance": round(tax_score, 2),            # out of 20
            "credit_bureau": round(bureau_score, 2),          # out of 15
            "qualitative": round(qualitative_score, 2)        # out of 15
        }
    }

def get_loan_decision(score: float, flags: List[str]) -> str:
    """
    Map the numerical score to a predefined categorical outcome.
    Check for any [HARD_REJECT] flags prior to score eval.
    """
    hard_rejects = [f for f in flags if "[HARD_REJECT]" in f.upper()]
    if hard_rejects:
        return "REJECT"

    if score >= 80:
        return "APPROVE"
    elif score >= 60:
        return "CONDITIONAL APPROVAL"
    elif score >= 40:
        return "MANUAL REVIEW"
    else:
        return "REJECT"

def compile_decision_report(extracted_data: Dict[str, Any], validation_flags: List[str], financial_flags: List[str], bank_flags: List[str], metrics_dict: Dict[str, float]) -> Dict[str, Any]:
    """
    Aggregates all components of the validation and risk pipeline to compile the final JSON structure.
    """
    all_flags = validation_flags + financial_flags + bank_flags
    
    # Compute score mathematically using simple rule engine
    scoring_result = compute_detailed_scores(extracted_data, all_flags)
    
    decision = get_loan_decision(scoring_result["overall"], all_flags)
    
    return {
        "loan_decision": decision,
        "credit_score": scoring_result["overall"],
        "risk_flags": all_flags,
        "financial_metrics": metrics_dict,
        "score_breakdown": scoring_result["breakdown"]
    }
