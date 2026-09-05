import json
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Investigation, Transaction, AuditLog
from ..schemas import InvestigationActionRequest

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


def _serialize(inv: Investigation, txn: Transaction | None = None) -> dict:
    return {
        "id": inv.id,
        "transaction_id": inv.transaction_id,
        "customer_name": txn.customer_name if txn else None,
        "processor": txn.processor if txn else None,
        "risk_level": inv.risk_level,
        "confidence_score": inv.confidence_score,
        "root_cause": inv.root_cause,
        "root_cause_detail": inv.root_cause_detail,
        "evidence": json.loads(inv.evidence),
        "reasoning_steps": json.loads(inv.reasoning_steps),
        "financial_impact": inv.financial_impact,
        "recommended_action": inv.recommended_action,
        "decision": inv.decision,
        "source_references": json.loads(inv.source_references),
        "status": inv.status,
        "created_at": inv.created_at,
        "resolved_at": inv.resolved_at,
    }


@router.get("")
def list_investigations(
    risk_level: Optional[str] = None,
    decision: Optional[str] = None,
    status: Optional[str] = None,
    sort_by_risk: bool = True,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Investigation)
    if risk_level:
        q = q.filter(Investigation.risk_level == risk_level)
    if decision:
        q = q.filter(Investigation.decision == decision)
    if status:
        q = q.filter(Investigation.status == status)

    investigations = q.limit(limit).all()

    if sort_by_risk:
        order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        investigations.sort(key=lambda i: (order.get(i.risk_level, 4), -i.financial_impact))

    txn_map = {
        t.transaction_id: t
        for t in db.query(Transaction)
        .filter(Transaction.transaction_id.in_([i.transaction_id for i in investigations]))
        .all()
    }

    return [_serialize(inv, txn_map.get(inv.transaction_id)) for inv in investigations]


@router.get("/{investigation_id}")
def get_investigation(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(404, "Investigation not found")
    txn = db.query(Transaction).filter(Transaction.transaction_id == inv.transaction_id).first()
    return _serialize(inv, txn)


@router.post("/{investigation_id}/action")
def take_action(investigation_id: int, req: InvestigationActionRequest, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(404, "Investigation not found")

    action_map = {"resolve": "resolved", "escalate": "escalated", "dismiss": "dismissed"}
    if req.action not in action_map:
        raise HTTPException(400, "Invalid action. Use resolve, escalate, or dismiss.")

    inv.status = action_map[req.action]
    if req.action == "resolve":
        inv.resolved_at = datetime.now(timezone.utc)
    db.commit()

    db.add(AuditLog(
        transaction_id=inv.transaction_id,
        investigation_id=inv.id,
        actor=req.actor,
        action=req.action.upper(),
        detail=req.note or f"{req.actor} marked investigation as {action_map[req.action]}.",
        confidence_score=inv.confidence_score,
        timestamp=datetime.now(timezone.utc),
    ))
    db.commit()

    return _serialize(inv)


@router.get("/summary/exception-counts")
def exception_counts(db: Session = Depends(get_db)):
    investigations = db.query(Investigation).all()
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for i in investigations:
        counts[i.risk_level] = counts.get(i.risk_level, 0) + 1
    return counts
