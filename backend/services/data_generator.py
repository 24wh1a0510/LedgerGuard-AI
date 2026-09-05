"""
LedgerGuard AI — Synthetic dataset generator.

Produces 150 transactions across the exact mix requested:
  70  normal (clean reconciliation)
  10  partial refunds
   5  duplicates
   5  missing settlements
   4  fee anomalies
   3  settlement delays
   2  incorrect bank credits
   1  complex multi-event case (several problems stacked on one transaction)

Each transaction carries the full Payment -> Refund -> Fee -> Tax ->
Settlement -> Bank Credit chain so the frontend's "Chain of Custody" screen
has real per-node status to render.
"""
import random
from datetime import datetime, timedelta, timezone
from faker import Faker

fake = Faker()
random.seed(42)
Faker.seed(42)

PROCESSORS = ["Stripe", "Adyen", "PayPal", "Braintree", "Checkout.com"]
FEE_RATE = 0.029
FEE_FIXED = 0.30
TAX_RATE = 0.08


def _base_amount():
    return round(random.uniform(25, 4800), 2)


def _make_chain(payment_amount, refund_amount=0.0):
    """Compute the expected chain of custody for a payment."""
    net_after_refund = payment_amount - refund_amount
    fee = round(net_after_refund * FEE_RATE + FEE_FIXED, 2)
    tax = round(net_after_refund * TAX_RATE, 2)
    expected_settlement = round(net_after_refund - fee, 2)
    return fee, tax, expected_settlement


def _new_txn(idx, category):
    payment_amount = _base_amount()
    payment_date = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
    txn = {
        "transaction_id": f"TXN-{100000 + idx}",
        "customer_name": fake.name(),
        "processor": random.choice(PROCESSORS),
        "currency": "USD",
        "category": category,
        "payment_amount": payment_amount,
        "refund_amount": 0.0,
        "fee_amount": 0.0,
        "tax_amount": 0.0,
        "expected_settlement": 0.0,
        "actual_settlement": 0.0,
        "bank_credit": 0.0,
        "payment_status": "matched",
        "refund_status": "matched",
        "fee_status": "matched",
        "tax_status": "matched",
        "settlement_status": "matched",
        "bank_credit_status": "matched",
        "discrepancy_amount": 0.0,
        "is_exception": False,
        "payment_date": payment_date,
        "settlement_date": payment_date + timedelta(days=2),
        "expected_settlement_date": payment_date + timedelta(days=2),
    }
    return txn


def _finalize_normal(txn):
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = expected_settlement
    txn["bank_credit"] = expected_settlement
    return txn


def _finalize_partial_refund(txn):
    refund = round(txn["payment_amount"] * random.uniform(0.15, 0.6), 2)
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"], refund)
    txn["refund_amount"] = refund
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    # 50/50: correctly reconciled partial refund vs. one where the refund
    # never made it into the settlement calc (a real leakage pattern)
    if random.random() < 0.5:
        txn["actual_settlement"] = expected_settlement
        txn["bank_credit"] = expected_settlement
        txn["refund_status"] = "matched"
    else:
        # refund amount was not deducted from settlement -> overpaid merchant
        wrong_settlement = round(expected_settlement + refund, 2)
        txn["actual_settlement"] = wrong_settlement
        txn["bank_credit"] = wrong_settlement
        txn["refund_status"] = "mismatch"
        txn["settlement_status"] = "mismatch"
        txn["discrepancy_amount"] = round(wrong_settlement - expected_settlement, 2)
        txn["is_exception"] = True
    return txn


def _finalize_duplicate(txn):
    # Duplicate charge: payment posted twice, only one should settle
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = round(expected_settlement * 2, 2)
    txn["bank_credit"] = txn["actual_settlement"]
    txn["payment_status"] = "duplicate"
    txn["settlement_status"] = "mismatch"
    txn["discrepancy_amount"] = round(txn["actual_settlement"] - expected_settlement, 2)
    txn["is_exception"] = True
    return txn


def _finalize_missing_settlement(txn):
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = 0.0
    txn["bank_credit"] = 0.0
    txn["settlement_status"] = "missing"
    txn["bank_credit_status"] = "missing"
    txn["settlement_date"] = None
    txn["discrepancy_amount"] = expected_settlement
    txn["is_exception"] = True
    return txn


def _finalize_fee_anomaly(txn):
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    # Fee charged well above the contracted rate
    inflated_fee = round(fee * random.uniform(2.0, 4.5), 2)
    wrong_settlement = round(txn["payment_amount"] - inflated_fee - tax, 2)
    txn["fee_amount"] = inflated_fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = wrong_settlement
    txn["bank_credit"] = wrong_settlement
    txn["fee_status"] = "mismatch"
    txn["settlement_status"] = "mismatch"
    txn["discrepancy_amount"] = round(expected_settlement - wrong_settlement, 2)
    txn["is_exception"] = True
    return txn


def _finalize_settlement_delay(txn):
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = expected_settlement
    txn["bank_credit"] = expected_settlement
    txn["settlement_date"] = txn["payment_date"] + timedelta(days=random.randint(9, 21))
    txn["settlement_status"] = "delayed"
    txn["bank_credit_status"] = "delayed"
    txn["is_exception"] = True
    return txn


def _finalize_incorrect_bank_credit(txn):
    fee, tax, expected_settlement = _make_chain(txn["payment_amount"])
    txn["fee_amount"] = fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = expected_settlement
    txn["actual_settlement"] = expected_settlement
    wrong_credit = round(expected_settlement - random.uniform(15, 300), 2)
    txn["bank_credit"] = max(wrong_credit, 0.0)
    txn["bank_credit_status"] = "mismatch"
    txn["discrepancy_amount"] = round(expected_settlement - txn["bank_credit"], 2)
    txn["is_exception"] = True
    return txn


def _finalize_complex_multi_event(txn):
    # Stack: partial refund + fee anomaly + settlement delay + wrong bank credit
    refund = round(txn["payment_amount"] * 0.25, 2)
    fee, tax, correct_expected = _make_chain(txn["payment_amount"], refund)
    inflated_fee = round(fee * 2.1, 2)
    txn["refund_amount"] = refund
    txn["fee_amount"] = inflated_fee
    txn["tax_amount"] = tax
    txn["expected_settlement"] = correct_expected
    wrong_settlement = round(
        txn["payment_amount"] - refund - inflated_fee - tax + 40, 2
    )
    txn["actual_settlement"] = wrong_settlement
    txn["bank_credit"] = round(wrong_settlement - 22.50, 2)
    txn["settlement_date"] = txn["payment_date"] + timedelta(days=14)
    txn["refund_status"] = "matched"
    txn["fee_status"] = "mismatch"
    txn["settlement_status"] = "delayed"
    txn["bank_credit_status"] = "mismatch"
    txn["discrepancy_amount"] = round(
        abs(correct_expected - txn["bank_credit"]), 2
    )
    txn["is_exception"] = True
    return txn


CATEGORY_PLAN = (
    # 70 "normal" as specified, plus 50 additional clean transactions so the
    # total reaches the required 150 (the specified category counts summed
    # to only 100) — kept as category "normal" throughout.
    [("normal", _finalize_normal)] * 120
    + [("partial_refund", _finalize_partial_refund)] * 10
    + [("duplicate", _finalize_duplicate)] * 5
    + [("missing_settlement", _finalize_missing_settlement)] * 5
    + [("fee_anomaly", _finalize_fee_anomaly)] * 4
    + [("settlement_delay", _finalize_settlement_delay)] * 3
    + [("incorrect_bank_credit", _finalize_incorrect_bank_credit)] * 2
    + [("complex_multi_event", _finalize_complex_multi_event)] * 1
)


def generate_dataset(seed: int = 42):
    random.seed(seed)
    Faker.seed(seed)
    random.shuffle(CATEGORY_PLAN)

    transactions = []
    for idx, (category, finalizer) in enumerate(CATEGORY_PLAN, start=1):
        txn = _new_txn(idx, category)
        txn = finalizer(txn)
        txn["discrepancy_amount"] = round(txn["discrepancy_amount"], 2)
        transactions.append(txn)

    assert len(transactions) == 150
    return transactions


if __name__ == "__main__":
    data = generate_dataset()
    from collections import Counter
    print(Counter(t["category"] for t in data))
    print(f"Total exceptions: {sum(1 for t in data if t['is_exception'])}")
    print(f"Total money at risk: {sum(t['discrepancy_amount'] for t in data):.2f}")
