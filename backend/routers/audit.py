from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import AuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("")
def list_audit_log(
    transaction_id: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if transaction_id:
        q = q.filter(AuditLog.transaction_id == transaction_id)
    if actor:
        q = q.filter(AuditLog.actor == actor)
    q = q.order_by(AuditLog.timestamp.desc()).limit(limit)

    return [
        {
            "id": a.id,
            "transaction_id": a.transaction_id,
            "investigation_id": a.investigation_id,
            "actor": a.actor,
            "action": a.action,
            "detail": a.detail,
            "confidence_score": a.confidence_score,
            "timestamp": a.timestamp,
        }
        for a in q.all()
    ]
