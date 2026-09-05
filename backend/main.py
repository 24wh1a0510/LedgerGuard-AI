"""
LedgerGuard AI — API entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000

On first run, seed the database with:
    python -m app.seed
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import database
from .models import models
from .routers import dashboard, transactions, investigations, analytics, audit

app = FastAPI(
    title="LedgerGuard AI",
    description="Trace. Explain. Protect. — Autonomous AI Finance Controller API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend origin(s) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database.Base.metadata.create_all(bind=database.engine)

app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(investigations.router)
app.include_router(analytics.router)
app.include_router(audit.router)


@app.get("/")
def root():
    return {
        "service": "LedgerGuard AI",
        "tagline": "Trace. Explain. Protect.",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "ledgerguard.db")
    return {"status": "ok", "database_seeded": os.path.exists(db_path)}
