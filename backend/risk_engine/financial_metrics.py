from typing import Dict, Any, Tuple

def evaluate_gst_variance(gstr1: float, gstr3b: float) -> Tuple[bool, str]:
    """
    Compute GST variance.
    Returns (is_acceptable, explanation/flag)
    """
    if not gstr1 or not gstr3b or gstr1 == 0:
        return True, ""
        
    variance = abs(gstr1 - gstr3b) / gstr1 * 100
    
    if variance <= 10:
        return True, ""
    elif variance <= 25:
        return True, f"GST variance {variance:.1f}% (>10% warning)"
    else:
        return False, f"High GST variance {variance:.1f}% (>25% risk)"

def evaluate_dscr(ebitda: float, debt_obligations: float) -> Tuple[bool, str, float]:
    """
    Compute Debt Service Coverage Ratio (DSCR).
    Returns (is_acceptable, flag, calculated_dscr)
    """
    if ebitda is None or debt_obligations is None or debt_obligations == 0:
        return True, "", 0.0
        
    dscr = ebitda / debt_obligations
    
    if dscr >= 1.25:
        return True, "", dscr
    elif dscr >= 1.0:
        return True, f"Moderate DSCR ({dscr:.2f})", dscr
    else:
        return False, f"[HARD_REJECT] DSCR < 1 ({dscr:.2f})", dscr

def evaluate_inventory(inventory: float) -> Tuple[bool, str]:
    """Validate inventory rules."""
    if inventory is None:
        return True, ""
        
    if inventory < 0:
        return False, "Invalid negative inventory"
    
    return True, ""

def evaluate_receivables(receivables: float, annual_turnover: float) -> Tuple[bool, str]:
    """Evaluate accounts receivable vs turnover."""
    if receivables is None or annual_turnover is None:
        return True, ""
        
    if receivables > annual_turnover:
        return False, "Accounts Receivable exceeds Annual Turnover"
        
    return True, ""

def evaluate_financial_metrics(extracted_data: Dict[str, Any]) -> Tuple[List[str], Dict[str, float]]:
    """
    Run all financial metric evaluations.
    Returns (list_of_flags, dict_of_calculated_metrics)
    """
    flags = []
    metrics = {}
    
    gstr1 = extracted_data.get("gstr1_revenue")
    gstr3b = extracted_data.get("gstr3b_revenue")
    ebitda = extracted_data.get("ebitda")
    long_term_debt = extracted_data.get("long_term_debt")
    inventory = extracted_data.get("inventory")
    receivables = extracted_data.get("accounts_receivable")
    
    # We'll use GSTR1 as a proxy for annual turnover if it wasn't provided separately
    annual_turnover = gstr1 if gstr1 else None

    # GST Variance
    _, gst_flag = evaluate_gst_variance(gstr1, gstr3b)
    if gst_flag:
        flags.append(gst_flag)
        
    # DSCR
    _, dscr_flag, dscr_val = evaluate_dscr(ebitda, long_term_debt)
    if dscr_val > 0:
        metrics["DSCR"] = round(dscr_val, 2)
    if dscr_flag:
        flags.append(dscr_flag)
        
    # Inventory
    _, inv_flag = evaluate_inventory(inventory)
    if inv_flag:
        flags.append(inv_flag)
        
    # Receivables
    _, rec_flag = evaluate_receivables(receivables, annual_turnover)
    if rec_flag:
        flags.append(rec_flag)
        
    # Also pass through the base metrics for output
    if ebitda is not None:
        metrics["EBITDA"] = ebitda
    if gstr1 is not None:
        metrics["GSTR1_Revenue"] = gstr1
        
    return flags, metrics
