# LedgerGuard AI — Deployment Guide

## Local development

### macOS / Linux

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed        # generates 150 transactions + runs AI investigations
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

```bash
# Frontend (second terminal)
cd frontend
npm install
cp .env.example .env      # sets VITE_API_URL=http://localhost:8000
npm run dev
```

App: http://localhost:5173

### Windows

```cmd
:: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

```cmd
:: Frontend (second terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

> **Important:** Always run `python -m app.seed` before starting the backend
> for the first time. The database file is not included in the repo.
> If you run seed twice it will duplicate data — delete
> `backend/data/ledgerguard.db` first if you need a clean reset.

---

## Production deployment

### Backend (FastAPI)

**Option A — Docker**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
RUN python -m app.seed
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t ledgerguard-api .
docker run -p 8000:8000 ledgerguard-api
```

**Option B — Render / Railway / Fly.io**
- Point the build at `backend/`, install `requirements.txt`.
- Run `python -m app.seed` once as a release/pre-deploy step.
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Switching to PostgreSQL** (recommended for production — SQLite is fine for demos):

```python
# backend/app/database.py
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://user:password@host:5432/ledgerguard"
```

Add `psycopg2-binary` to `requirements.txt`. No other code changes needed —
every query goes through the SQLAlchemy ORM.

### Frontend (Vite + React)

**Option A — Vercel / Netlify**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-api-domain.com`

**Option B — Static hosting / Nginx**

```bash
cd frontend
npm run build
# serve the dist/ folder with any static file server
```

### CORS

`backend/app/main.py` currently allows all origins (`allow_origins=["*"]`) for
local development. In production, restrict this to your deployed frontend origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment variables

| Variable | File | Purpose |
|---|---|---|
| `VITE_API_URL` | `frontend/.env` | Base URL the frontend uses to call the API |
| `SQLALCHEMY_DATABASE_URL` | `backend/app/database.py` | Swap SQLite → Postgres for production |

### Re-seeding

The dataset generator uses a fixed random seed (`seed=42`), so
`python -m app.seed` always produces the same 150 transactions and
investigation outcomes — safe to re-run for a consistent demo after deleting
the database file.

```bash
# Clean reset
rm backend/data/ledgerguard.db   # or del on Windows
python -m app.seed
```
