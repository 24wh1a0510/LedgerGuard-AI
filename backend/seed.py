"""
LedgerGuard AI — Seed the database with synthetic data + AI investigations.

Run with:  python -m app.seed
"""
import json
from datetime import datetime, timezone
from . import database
from .models import models
from .services.data_generator import generate_dataset
from .services.ai_agent import run_investigations


def seed():
    database.Base.metadata.drop_all(bind=database.engine)
    database.Base.metadata.create_all(bind=database.engine)

    db = database.SessionLocal()
    try:
        raw_transactions = generate_dataset()
        investigations = run_investigations(raw_transactions)
        inv_by_txn = {inv["transaction_id"]: inv for inv in investigations}

        for t in raw_transactions:
            txn = models.Transaction(
                transaction_id=t["transaction_id"],
                customer_name=t["customer_name"],
                processor=t["processor"],
                currency=t["currency"],
                category=t["category"],
                payment_amount=t["payment_amount"],
                refund_amount=t["refund_amount"],
                fee_amount=t["fee_amount"],
                tax_amount=t["tax_amount"],
                expected_settlement=t["expected_settlement"],
                actual_settlement=t["actual_settlement"],
                bank_credit=t["bank_credit"],
                payment_status=t["payment_status"],
                refund_status=t["refund_status"],
                fee_status=t["fee_status"],
                tax_status=t["tax_status"],
                settlement_status=t["settlement_status"],
                bank_credit_status=t["bank_credit_status"],
                discrepancy_amount=t["discrepancy_amount"],
                is_exception=t["is_exception"],
                anomaly_score=t.get("anomaly_score", 0.0),
                payment_date=t["payment_date"],
                settlement_date=t["settlement_date"],
                expected_settlement_date=t["expected_settlement_date"],
            )
            db.add(txn)

        db.commit()

        for inv_data in investigations:
            inv = models.Investigation(**inv_data)
            db.add(inv)
        db.commit()

        # Seed audit log from investigations
        for inv_data in investigations:
            db.add(models.AuditLog(
                transaction_id=inv_data["transaction_id"],
                actor="LedgerGuard AI Agent",
                action=inv_data["decision"],
                detail=inv_data["recommended_action"],
                confidence_score=inv_data["confidence_score"],
                timestamp=inv_data["created_at"],
            ))
        db.commit()

        print(f"Seeded {len(raw_transactions)} transactions, {len(investigations)} investigations.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
