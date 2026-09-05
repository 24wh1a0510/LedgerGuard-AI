"""
LedgerGuard AI — Core data models.

Two tables carry the whole system:
  Transaction   -> one row per payment lifecycle (payment -> refund -> fee ->
                   tax -> settlement -> bank credit), i.e. the Chain of Custody.
  Investigation -> the AI agent's findings for any transaction that failed
                   reconciliation (root cause, evidence, confidence, decision).
AuditLog captures every AI decision + any human action taken on it, so
every investigation is fully explainable after the fact.
"""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .. import database

Base = database.Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    processor = Column(String, nullable=False)  # Stripe, Adyen, PayPal, etc.
    currency = Column(String, default="USD")
    category = Column(String, nullable=False)  # normal, partial_refund, duplicate, ...

    # Chain of Custody amounts
    payment_amount = Column(Float, nullable=False)
    refund_amount = Column(Float, default=0.0)
    fee_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    expected_settlement = Column(Float, nullable=False)
    actual_settlement = Column(Float, nullable=False)
    bank_credit = Column(Float, nullable=False)

    # Node-by-node status for the Chain of Custody screen
    payment_status = Column(String, default="matched")
    refund_status = Column(String, default="matched")
    fee_status = Column(String, default="matched")
    tax_status = Column(String, default="matched")
    settlement_status = Column(String, default="matched")
    bank_credit_status = Column(String, default="matched")

    discrepancy_amount = Column(Float, default=0.0)
    is_exception = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)  # from Isolation Forest, higher = more anomalous

    payment_date = Column(DateTime, nullable=False)
    settlement_date = Column(DateTime, nullable=True)
    expected_settlement_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    investigations = relationship("Investigation", back_populates="transaction")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), nullable=False)

    risk_level = Column(String, nullable=False)  # critical, high, medium, low
    confidence_score = Column(Float, nullable=False)  # 0-100
    root_cause = Column(String, nullable=False)
    root_cause_detail = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)  # JSON-encoded list of evidence items
    reasoning_steps = Column(Text, nullable=False)  # JSON-encoded list of agent steps
    financial_impact = Column(Float, nullable=False)
    recommended_action = Column(Text, nullable=False)
    decision = Column(String, nullable=False)  # AUTO_RESOLVE, RECOMMEND, ESCALATE
    source_references = Column(Text, nullable=False)  # JSON-encoded list

    status = Column(String, default="open")  # open, resolved, escalated, dismissed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="investigations")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True, nullable=False)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    actor = Column(String, nullable=False)  # "AI Agent" or a user name
    action = Column(String, nullable=False)  # e.g. "AUTO_RESOLVED", "ESCALATED", "COMMENT_ADDED"
    detail = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
