from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Transaction, Investigation

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/leakage-by-category")
def leakage_by_category(db: Session = Depends(get_db)):
    investigations = db.query(Investigation).all()
    by_cat = defaultdict(float)
    txn_map = {t.transaction_id: t for t in db.query(Transaction).all()}
    for inv in investigations:
        txn = txn_map.get(inv.transaction_id)
        cat = txn.category if txn else "unknown"
        by_cat[cat] += inv.financial_impact

    return [{"category": k, "amount_at_risk": round(v, 2)} for k, v in sorted(by_cat.items(), key=lambda x: -x[1])]


@router.get("/fee-anomalies")
def fee_anomalies(db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(Transaction.fee_status == "mismatch").all()
    return [
        {
            "transaction_id": t.transaction_id,
            "processor": t.processor,
            "payment_amount": t.payment_amount,
            "fee_amount": t.fee_amount,
            "expected_fee_pct": 2.9,
            "actual_fee_pct": round((t.fee_amount / t.payment_amount) * 100, 2) if t.payment_amount else 0,
        }
        for t in txns
    ]


@router.get("/settlement-delays")
def settlement_delays(db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(Transaction.settlement_status == "delayed").all()
    result = []
    for t in txns:
        days = (t.settlement_date - t.payment_date).days if t.settlement_date else None
        result.append({
            "transaction_id": t.transaction_id,
            "processor": t.processor,
            "payment_date": t.payment_date,
            "settlement_date": t.settlement_date,
            "days_delayed": days,
        })
    return result


@router.get("/duplicate-transactions")
def duplicate_transactions(db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(Transaction.payment_status == "duplicate").all()
    return [
        {
            "transaction_id": t.transaction_id,
            "customer_name": t.customer_name,
            "processor": t.processor,
            "payment_amount": t.payment_amount,
            "overpaid_amount": t.discrepancy_amount,
        }
        for t in txns
    ]


@router.get("/recovery-opportunities")
def recovery_opportunities(db: Session = Depends(get_db)):
    investigations = (
        db.query(Investigation)
        .filter(Investigation.status.in_(["open", "escalated"]))
        .order_by(Investigation.financial_impact.desc())
        .all()
    )
    total_recoverable = sum(i.financial_impact for i in investigations)
    return {
        "total_recoverable": round(total_recoverable, 2),
        "opportunities": [
            {
                "transaction_id": i.transaction_id,
                "root_cause": i.root_cause,
                "financial_impact": i.financial_impact,
                "recommended_action": i.recommended_action,
                "risk_level": i.risk_level,
            }
            for i in investigations
        ],
    }


@router.get("/processor-breakdown")
def processor_breakdown(db: Session = Depends(get_db)):
    txns = db.query(Transaction).all()
    by_proc = defaultdict(lambda: {"volume": 0.0, "count": 0, "exceptions": 0})
    for t in txns:
        by_proc[t.processor]["volume"] += t.payment_amount
        by_proc[t.processor]["count"] += 1
        if t.is_exception:
            by_proc[t.processor]["exceptions"] += 1

    return [
        {
            "processor": proc,
            "volume": round(data["volume"], 2),
            "count": data["count"],
            "exceptions": data["exceptions"],
        }
        for proc, data in by_proc.items()
    ]
