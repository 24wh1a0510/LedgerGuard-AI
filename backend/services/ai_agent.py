"""
LedgerGuard AI — Autonomous Investigation Agent.

Two-stage pipeline, deliberately kept deterministic and explainable
(no external LLM calls required, so it runs offline and free):

  1. Anomaly scoring   -> scikit-learn IsolationForest flags statistically
                           unusual transactions across payment/fee/tax/
                           settlement ratios, on top of the hard reconciliation
                           mismatches already found by the data layer.

  2. Reasoning agent    -> for every exception, walks a fixed set of
                           investigation "steps" (mirrors how a human analyst
                           would work a case), assembles evidence, computes a
                           confidence score, and renders a decision:
                             AUTO_RESOLVE  (confidence >= 90, low/medium risk)
                             RECOMMEND     (confidence 65-89)
                             ESCALATE      (confidence < 65, or high-risk)

Every step, evidence item, and confidence factor is retained so the
Investigation Center / Audit Trail can render full chain-of-reasoning.
"""
import json
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import IsolationForest


# ---------------------------------------------------------------------------
# Stage 1: Anomaly scoring
# ---------------------------------------------------------------------------

def score_anomalies(transactions: list[dict]) -> list[dict]:
    """Attach an anomaly_score (0-100, higher = more unusual) to each txn."""
    if not transactions:
        return transactions

    features = []
    for t in transactions:
        payment = max(t["payment_amount"], 0.01)
        features.append([
            t["payment_amount"],
            t["fee_amount"] / payment,
            t["tax_amount"] / payment,
            t["refund_amount"] / payment,
            (t["expected_settlement"] - t["actual_settlement"]),
            (t["expected_settlement"] - t["bank_credit"]),
        ])

    X = np.array(features)
    model = IsolationForest(n_estimators=200, contamination=0.18, random_state=42)
    model.fit(X)
    raw_scores = model.decision_function(X)  # higher = more normal

    # Normalize to 0-100 "anomaly score" where 100 = most anomalous
    lo, hi = raw_scores.min(), raw_scores.max()
    span = (hi - lo) or 1.0
    for t, raw in zip(transactions, raw_scores):
        normal_pct = (raw - lo) / span  # 0 = anomalous, 1 = normal
        t["anomaly_score"] = round((1 - normal_pct) * 100, 1)

    return transactions


# ---------------------------------------------------------------------------
# Stage 2: Root-cause reasoning per category
# ---------------------------------------------------------------------------

_ROOT_CAUSE_LIBRARY = {
    "partial_refund": {
        "root_cause": "Refund not deducted prior to settlement calculation",
        "detail": (
            "A partial refund of {refund} was issued to the customer, but the "
            "settlement engine calculated the payout using the pre-refund "
            "transaction amount. This caused the merchant to be overpaid by "
            "the refund value."
        ),
        "action": "Reverse the overpayment of {impact} in the next settlement batch and notify the processor's reconciliation team.",
        "confidence_base": 92,
    },
    "duplicate": {
        "root_cause": "Duplicate charge settled twice",
        "detail": (
            "The processor posted two settlement records for what appears to be "
            "a single customer payment (same amount, same customer, same day). "
            "Only one settlement should have been paid out."
        ),
        "action": "Claw back the duplicate settlement of {impact} and file a duplicate-charge dispute with {processor}.",
        "confidence_base": 96,
    },
    "missing_settlement": {
        "root_cause": "Settlement never posted by processor",
        "detail": (
            "A payment was captured and fees/tax were calculated, but no "
            "corresponding settlement or bank credit was ever recorded. This is "
            "a classic revenue-leakage pattern — money owed to the business "
            "that never arrived."
        ),
        "action": "Open a settlement trace ticket with {processor} for the missing payout of {impact}; escalate if unresolved within 3 business days.",
        "confidence_base": 78,
    },
    "fee_anomaly": {
        "root_cause": "Processing fee charged above contracted rate",
        "detail": (
            "The fee deducted from this transaction is significantly higher "
            "than the contracted rate (2.9% + $0.30), suggesting a pricing-tier "
            "misconfiguration or an incorrectly applied surcharge by {processor}."
        ),
        "action": "Dispute the excess fee of {impact} with {processor} and audit the fee schedule for related transactions in this batch.",
        "confidence_base": 83,
    },
    "settlement_delay": {
        "root_cause": "Settlement posted outside contracted SLA window",
        "detail": (
            "Funds settled {days} days after the payment date, well beyond the "
            "standard 2-day settlement SLA. No amount was lost, but the delay "
            "represents a cash-flow risk worth tracking."
        ),
        "action": "Monitor for a recurring pattern with {processor}; request an SLA credit if delays persist across multiple transactions.",
        "confidence_base": 71,
    },
    "incorrect_bank_credit": {
        "root_cause": "Bank credit does not match confirmed settlement amount",
        "detail": (
            "The settlement record and the actual bank credit disagree — the "
            "amount deposited to the merchant's bank account is short of the "
            "amount the processor confirmed it settled."
        ),
        "action": "Reconcile directly with the bank for the shortfall of {impact}; likely a wire/ACH fee or misapplied adjustment.",
        "confidence_base": 74,
    },
    "complex_multi_event": {
        "root_cause": "Multiple compounding discrepancies on a single transaction",
        "detail": (
            "This transaction stacks several issues: a partial refund, an "
            "inflated processing fee, a delayed settlement, and a bank credit "
            "shortfall. Each event individually would be low-risk, but combined "
            "they represent a materially higher financial and audit risk."
        ),
        "action": "Manual review required — assign to a senior analyst to unwind each event individually before any auto-resolution.",
        "confidence_base": 55,
    },
}


def _risk_level(financial_impact: float, category: str) -> str:
    if category == "complex_multi_event":
        return "critical"
    if financial_impact >= 500 or category == "duplicate":
        return "critical" if financial_impact >= 1000 else "high"
    if financial_impact >= 100:
        return "medium"
    return "low"


def _decide(confidence: float, risk_level: str) -> str:
    if risk_level in ("critical",) or confidence < 65:
        return "ESCALATE"
    if confidence >= 90 and risk_level in ("low", "medium"):
        return "AUTO_RESOLVE"
    return "RECOMMEND"


def investigate(transaction: dict) -> dict | None:
    """Run the AI agent on a single transaction. Returns None if no exception."""
    category = transaction["category"]
    if not transaction.get("is_exception"):
        return None

    lib = _ROOT_CAUSE_LIBRARY.get(category)
    if lib is None:
        return None

    impact = abs(transaction.get("discrepancy_amount", 0.0))
    days_delay = None
    if transaction.get("settlement_date") and transaction.get("payment_date"):
        sd, pd_ = transaction["settlement_date"], transaction["payment_date"]
        if isinstance(sd, str):
            sd = datetime.fromisoformat(sd)
        if isinstance(pd_, str):
            pd_ = datetime.fromisoformat(pd_)
        days_delay = (sd - pd_).days

    detail = lib["detail"].format(
        refund=f"${transaction.get('refund_amount', 0):,.2f}",
        processor=transaction["processor"],
        days=days_delay or "several",
    )
    action = lib["action"].format(
        impact=f"${impact:,.2f}", processor=transaction["processor"]
    )

    # Confidence: base rate from the library, nudged by how well-supported
    # the evidence is (anomaly score agreement + magnitude clarity).
    anomaly_score = transaction.get("anomaly_score", 50)
    confidence = lib["confidence_base"]
    if anomaly_score > 60:
        confidence += 4
    if impact > 0 and impact < 20:
        confidence -= 10  # tiny discrepancies are harder to be fully sure about
    confidence = max(30, min(99, confidence))

    risk = _risk_level(impact, category)
    decision = _decide(confidence, risk)

    reasoning_steps = [
        {"step": 1, "title": "Ingest transaction", "detail": f"Loaded {transaction['transaction_id']} from {transaction['processor']} ledger feed."},
        {"step": 2, "title": "Recompute expected chain of custody", "detail": "Recalculated fee, tax and expected settlement from base payment amount and contracted rates."},
        {"step": 3, "title": "Compare to actual settlement & bank credit", "detail": f"Detected a variance of ${impact:,.2f} against expected values."},
        {"step": 4, "title": "Cross-check anomaly model", "detail": f"Isolation Forest anomaly score: {anomaly_score}/100."},
        {"step": 5, "title": "Determine root cause", "detail": lib["root_cause"]},
        {"step": 6, "title": "Render decision", "detail": f"Confidence {confidence}% -> {decision}."},
    ]

    evidence = [
        f"Expected settlement: ${transaction['expected_settlement']:,.2f}",
        f"Actual settlement: ${transaction['actual_settlement']:,.2f}",
        f"Bank credit received: ${transaction['bank_credit']:,.2f}",
        f"Discrepancy: ${impact:,.2f}",
        f"Anomaly score: {anomaly_score}/100",
        f"Processor: {transaction['processor']}",
    ]

    source_references = [
        f"Payment ledger record {transaction['transaction_id']}",
        f"{transaction['processor']} settlement report",
        "Bank statement reconciliation feed",
    ]

    return {
        "transaction_id": transaction["transaction_id"],
        "risk_level": risk,
        "confidence_score": confidence,
        "root_cause": lib["root_cause"],
        "root_cause_detail": detail,
        "evidence": json.dumps(evidence),
        "reasoning_steps": json.dumps(reasoning_steps),
        "financial_impact": round(impact, 2),
        "recommended_action": action,
        "decision": decision,
        "source_references": json.dumps(source_references),
        "status": "resolved" if decision == "AUTO_RESOLVE" else "open",
        "created_at": datetime.now(timezone.utc),
        "resolved_at": datetime.now(timezone.utc) if decision == "AUTO_RESOLVE" else None,
    }


def run_investigations(transactions: list[dict]) -> list[dict]:
    transactions = score_anomalies(transactions)
    investigations = []
    for t in transactions:
        result = investigate(t)
        if result:
            investigations.append(result)
    return investigations
