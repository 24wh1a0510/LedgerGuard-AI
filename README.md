# LedgerGuard AI

**Trace. Explain. Protect.**

An autonomous AI Finance Controller that reconciles payments, refunds, fees,
taxes, settlements, and bank credits — then investigates what doesn't match,
explains why, and decides whether to auto-resolve, recommend, or escalate.

Built as a premium fintech SaaS console in the style of Stripe / Ramp / Brex,
not a generic AI dashboard.

## What's inside

```
ledgerguard-ai/
├── backend/          FastAPI + SQLite + scikit-learn
│   ├── app/
│   │   ├── models/           SQLAlchemy models (Transaction, Investigation, AuditLog)
│   │   ├── routers/          dashboard, transactions, investigations, analytics, audit
│   │   ├── services/
│   │   │   ├── data_generator.py   synthetic 150-transaction dataset
│   │   │   └── ai_agent.py         Isolation Forest + rule-based reasoning agent
│   │   ├── main.py           FastAPI app
│   │   └── seed.py           generates data + runs investigations into the DB
│   └── requirements.txt
├── frontend/         React + TypeScript + Vite + Tailwind + Framer Motion
│   └── src/
│       ├── pages/            Landing, Dashboard, Transaction Explorer,
│       │                     Chain of Custody, Investigation Center,
│       │                     Exception Command Center, Analytics, Audit Trail
│       ├── components/       AppShell, KpiCard, ParticleField, Shared
│       └── lib/              typed API client + formatting helpers
├── .gitignore
├── README.md
└── DEPLOYMENT.md
```

## Quick start

### macOS / Linux

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000

# Frontend (open a second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Windows

```cmd
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000

# Frontend (open a second terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173 — the landing page links straight into the console.

> **Note:** The database file (`backend/data/ledgerguard.db`) is not committed
> to the repo. You must run `python -m app.seed` once before starting the
> backend. This generates 150 transactions and runs all AI investigations.

## The seven screens

1. **Executive Dashboard** — animated KPI cards, volume/exception trend, risk
   heatmap by processor, financial health score, recent investigations feed.
2. **Transaction Explorer** — search, filter by category/processor/exception
   status, expandable rows with the full reconciliation breakdown.
3. **Financial Chain of Custody** (the centerpiece) — an animated node graph
   tracing Payment → Refunds → Fees → Taxes → Settlement → Bank Credit → Final
   AI Decision, with a pulsing red path wherever a discrepancy exists and
   click-to-expand evidence per node.
4. **AI Investigation Center** — a ChatGPT-style reasoning panel: root cause,
   step-by-step agent timeline, evidence list, confidence score, source
   references, and resolve/escalate actions.
5. **Exception Command Center** — the open-case queue sorted by risk
   (critical → low), each with amount, confidence, and suggested action.
6. **Analytics & Insights** — leakage by category, fee anomalies, settlement
   delays, duplicate transactions, and recovery opportunities.
7. **Audit Trail** — a full timeline of every AI decision and human action,
   fully explainable after the fact.

## How the AI agent decides

For every transaction, the agent:

1. Recomputes the expected chain of custody from the base payment amount.
2. Compares it against actual settlement and bank credit.
3. Cross-checks an Isolation Forest anomaly score.
4. Matches the discrepancy pattern to a root-cause template (duplicate
   charge, missing settlement, fee anomaly, settlement delay, etc.).
5. Computes a confidence score and financial impact.
6. Decides: **AUTO_RESOLVE** (high confidence, low/medium risk),
   **RECOMMEND** (medium confidence), or **ESCALATE** (low confidence or
   critical risk).

This is deliberately a deterministic, explainable rule engine rather than an
opaque LLM call — every number and decision in the API is reproducible and
auditable, which matters more than novelty for a finance-control product.

No external AI API keys are required. The entire system runs offline.

## Dataset

150 synthetic transactions, generated with a fixed seed for reproducibility:
120 clean (normal) transactions, 10 partial refunds, 5 duplicates,
5 missing settlements, 4 fee anomalies, 3 settlement delays,
2 incorrect bank credits, and 1 complex multi-event case stacking several
problems on a single transaction.

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.115 |
| Database | SQLite (SQLAlchemy ORM) |
| AI / Anomaly detection | scikit-learn Isolation Forest |
| Data generation | Faker + NumPy |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |

See `DEPLOYMENT.md` for production deployment (Docker, Postgres migration,
Vercel/Render, CORS configuration).
