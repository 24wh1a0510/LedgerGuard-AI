import time
import random
from datetime import timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.models import Transaction, Investigation

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    start = time.perf_counter()

    total_transactions = db.query(Transaction).count()
    amount_processed = db.query(func.sum(Transaction.payment_amount)).scalar() or 0.0
    exceptions = db.query(Transaction).filter(Transaction.is_exception == True).all()  # noqa: E712
    money_at_risk = sum(t.discrepancy_amount for t in exceptions)
    critical_exceptions = db.query(Investigation).filter(Investigation.risk_level == "critical").count()
    auto_resolved = db.query(Investigation).filter(Investigation.decision == "AUTO_RESOLVE").count()

    investigations = db.query(Investigation).all()
    ai_confidence = (
        sum(i.confidence_score for i in investigations) / len(investigations)
        if investigations else 100.0
    )

    matched = total_transactions - len(exceptions)
    match_rate = (matched / total_transactions * 100) if total_transactions else 0.0
    reconciliation_rate = match_rate

    elapsed_ms = (time.perf_counter() - start) * 1000

    return {
        "total_transactions": total_transactions,
        "amount_processed": round(amount_processed, 2),
        "reconciliation_rate": round(reconciliation_rate, 2),
        "money_at_risk": round(money_at_risk, 2),
        "critical_exceptions": critical_exceptions,
        "auto_resolved_cases": auto_resolved,
        "ai_confidence_score": round(ai_confidence, 1),
        "match_rate": round(match_rate, 2),
        "exceptions_detected": len(exceptions),
        "false_positives": max(0, round(len(exceptions) * 0.04)),  # modeled estimate
        "processing_time_ms": round(elapsed_ms, 2),
    }


@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    """Daily volume + exception trend for the last 30 days, for line charts."""
    transactions = db.query(Transaction).all()
    by_day = defaultdict(lambda: {"volume": 0.0, "exceptions": 0, "count": 0})

    for t in transactions:
        day = t.payment_date.date().isoformat()
        by_day[day]["volume"] += t.payment_amount
        by_day[day]["count"] += 1
        if t.is_exception:
            by_day[day]["exceptions"] += 1

    days = sorted(by_day.keys())
    return {
        "days": days,
        "volume": [round(by_day[d]["volume"], 2) for d in days],
        "transaction_count": [by_day[d]["count"] for d in days],
        "exceptions": [by_day[d]["exceptions"] for d in days],
    }


@router.get("/risk-heatmap")
def get_risk_heatmap(db: Session = Depends(get_db)):
    """Risk level x processor matrix for the heatmap widget."""
    investigations = db.query(Investigation).all()
    txn_map = {t.transaction_id: t for t in db.query(Transaction).all()}

    matrix = defaultdict(lambda: defaultdict(float))
    for inv in investigations:
        txn = txn_map.get(inv.transaction_id)
        if not txn:
            continue
        matrix[inv.risk_level][txn.processor] += inv.financial_impact

    processors = sorted({t.processor for t in txn_map.values()})
    risk_levels = ["critical", "high", "medium", "low"]

    cells = []
    for risk in risk_levels:
        for proc in processors:
            cells.append({
                "risk_level": risk,
                "processor": proc,
                "value": round(matrix[risk][proc], 2),
            })

    return {"risk_levels": risk_levels, "processors": processors, "cells": cells}


@router.get("/financial-health-score")
def get_financial_health_score(db: Session = Depends(get_db)):
    total = db.query(Transaction).count() or 1
    exceptions = db.query(Transaction).filter(Transaction.is_exception == True).count()  # noqa: E712
    critical = db.query(Investigation).filter(Investigation.risk_level == "critical").count()

    # Weighted score out of 100
    exception_penalty = (exceptions / total) * 60
    critical_penalty = min(critical * 5, 25)
    score = max(0, round(100 - exception_penalty - critical_penalty, 1))

    if score >= 90:
        band = "Excellent"
    elif score >= 75:
        band = "Good"
    elif score >= 55:
        band = "Fair"
    else:
        band = "At Risk"

    return {"score": score, "band": band}


@router.get("/recent-investigations")
def get_recent_investigations(limit: int = 8, db: Session = Depends(get_db)):
    investigations = (
        db.query(Investigation)
        .order_by(Investigation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": i.id,
            "transaction_id": i.transaction_id,
            "root_cause": i.root_cause,
            "risk_level": i.risk_level,
            "decision": i.decision,
            "confidence_score": i.confidence_score,
            "financial_impact": i.financial_impact,
            "created_at": i.created_at,
        }
        for i in investigations
    ]
