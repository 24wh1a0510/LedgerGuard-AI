"""
LedgerGuard AI — Database configuration.

Uses SQLite for local/demo runs. Swap SQLALCHEMY_DATABASE_URL to a
Postgres DSN (e.g. postgresql+psycopg2://user:pass@host/db) for production —
no other code changes are required since we only use the ORM layer.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ledgerguard.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
