from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Transaction, Investigation
from ..schemas import TransactionOut

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    search: Optional[str] = None,
    category: Optional[str] = None,
    processor: Optional[str] = None,
    is_exception: Optional[bool] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Transaction)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Transaction.transaction_id.ilike(like))
            | (Transaction.customer_name.ilike(like))
        )
    if category:
        q = q.filter(Transaction.category == category)
    if processor:
        q = q.filter(Transaction.processor == processor)
    if is_exception is not None:
        q = q.filter(Transaction.is_exception == is_exception)
    if min_amount is not None:
        q = q.filter(Transaction.payment_amount >= min_amount)
    if max_amount is not None:
        q = q.filter(Transaction.payment_amount <= max_amount)

    q = q.order_by(Transaction.payment_date.desc())
    return q.offset(offset).limit(limit).all()


# NOTE: /meta/filters MUST be defined before /{transaction_id} so FastAPI
# does not treat the literal string "meta" as a transaction_id path param.
@router.get("/meta/filters")
def get_filter_options(db: Session = Depends(get_db)):
    processors = [r[0] for r in db.query(Transaction.processor).distinct().all()]
    categories = [r[0] for r in db.query(Transaction.category).distinct().all()]
    return {"processors": processors, "categories": categories}


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    return txn


@router.get("/{transaction_id}/chain-of-custody")
def get_chain_of_custody(transaction_id: str, db: Session = Depends(get_db)):
    """Node-by-node data for the animated Chain of Custody flow graph."""
    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")

    investigation = (
        db.query(Investigation)
        .filter(Investigation.transaction_id == transaction_id)
        .order_by(Investigation.created_at.desc())
        .first()
    )

    nodes = [
        {
            "key": "payment",
            "label": "Payment",
            "amount": txn.payment_amount,
            "status": txn.payment_status,
            "date": txn.payment_date,
        },
        {
            "key": "refund",
            "label": "Refunds",
            "amount": txn.refund_amount,
            "status": txn.refund_status,
            "date": txn.payment_date,
        },
        {
            "key": "fee",
            "label": "Fees",
            "amount": txn.fee_amount,
            "status": txn.fee_status,
            "date": txn.payment_date,
        },
        {
            "key": "tax",
            "label": "Taxes",
            "amount": txn.tax_amount,
            "status": txn.tax_status,
            "date": txn.payment_date,
        },
        {
            "key": "settlement",
            "label": "Settlement",
            "amount": txn.actual_settlement,
            "expected_amount": txn.expected_settlement,
            "status": txn.settlement_status,
            "date": txn.settlement_date,
        },
        {
            "key": "bank_credit",
            "label": "Bank Credit",
            "amount": txn.bank_credit,
            "expected_amount": txn.expected_settlement,
            "status": txn.bank_credit_status,
            "date": txn.settlement_date,
        },
        {
            "key": "ai_decision",
            "label": "Final AI Decision",
            "amount": investigation.financial_impact if investigation else 0,
            "status": investigation.decision if investigation else "matched",
            "date": investigation.created_at if investigation else txn.payment_date,
        },
    ]

    has_discrepancy = txn.is_exception
    return {
        "transaction_id": txn.transaction_id,
        "customer_name": txn.customer_name,
        "processor": txn.processor,
        "category": txn.category,
        "has_discrepancy": has_discrepancy,
        "discrepancy_amount": txn.discrepancy_amount,
        "nodes": nodes,
        "investigation": {
            "root_cause": investigation.root_cause,
            "confidence_score": investigation.confidence_score,
            "decision": investigation.decision,
            "risk_level": investigation.risk_level,
        } if investigation else None,
    }
