"""LedgerGuard AI — API response/request schemas."""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    customer_name: str
    processor: str
    currency: str
    category: str
    payment_amount: float
    refund_amount: float
    fee_amount: float
    tax_amount: float
    expected_settlement: float
    actual_settlement: float
    bank_credit: float
    payment_status: str
    refund_status: str
    fee_status: str
    tax_status: str
    settlement_status: str
    bank_credit_status: str
    discrepancy_amount: float
    is_exception: bool
    anomaly_score: float
    payment_date: datetime
    settlement_date: Optional[datetime] = None
    expected_settlement_date: Optional[datetime] = None


class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    risk_level: str
    confidence_score: float
    root_cause: str
    root_cause_detail: str
    evidence: str
    reasoning_steps: str
    financial_impact: float
    recommended_action: str
    decision: str
    source_references: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: str
    investigation_id: Optional[int] = None
    actor: str
    action: str
    detail: str
    confidence_score: Optional[float] = None
    timestamp: datetime


class DashboardSummary(BaseModel):
    total_transactions: int
    amount_processed: float
    reconciliation_rate: float
    money_at_risk: float
    critical_exceptions: int
    auto_resolved_cases: int
    ai_confidence_score: float
    match_rate: float
    exceptions_detected: int
    false_positives: int
    processing_time_ms: float


class InvestigationActionRequest(BaseModel):
    action: str  # "resolve", "escalate", "dismiss"
    actor: str = "Analyst"
    note: Optional[str] = None
