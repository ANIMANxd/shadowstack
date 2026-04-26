# ShadowStack — Predictive Cloud Cost Optimizer

> **BCA 6th Semester Capstone Project**  
> An intelligent system that predicts infrastructure costs **before** code deployment and proactively provides optimisation recommendations.

---

## What This Project Does

ShadowStack solves the **$17.6B cloud waste problem** by shifting cost awareness **left** into the developer workflow:

1. A developer opens a GitHub Pull Request with Python code changes
2. ShadowStack receives the PR event via a **GitHub Webhook** (HMAC-SHA256 validated)
3. The backend runs **Python AST analysis** on changed files to extract:
   - Function count
   - Loop count (including nested loops)
   - Branch count
   - Cyclomatic complexity score (1–10)
4. A **Random Forest ML model** predicts the monthly infrastructure cost impact in USD
5. A **Multi-Step LSTM** separately forecasts the 30-day cost trend
6. **Google Gemini AI** analyses the code and generates intelligent optimisation suggestions with refactored code examples
7. The system **automatically posts a markdown comment** on the PR showing:
   - Baseline cost
   - Predicted cost
   - Delta (+$X / -$X)
   - **AI-powered optimisation recommendations**
8. All predictions are stored in **PostgreSQL** with full audit history
9. A **React + Vite + D3.js** dashboard visualises:
   - Real-time cost trends
   - Service-wise breakdown
   - 30-day LSTM forecast
   - ML model performance metrics (MAE, RMSE, R²)
   - PR prediction history with recommendations
   - **PR Analyzer** — select any open PR, view diffs, and run AI analysis on-demand

---

## Architecture

```
┌──────────────┐     Webhook      ┌──────────────────┐
│   GitHub PR  │ ───────────────> │  FastAPI Backend │
└──────────────┘   (HMAC-SHA256)  └──────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │  AST Parser  │    │ Random Forest│    │  LSTM Model  │
            │  (Complexity)│    │ (Cost Impact)│    │(30-Day Trend)│
            └──────────────┘    └──────────────┘    └──────────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         ▼
                              ┌──────────────────┐
                              │   PostgreSQL DB  │
                              │  (predictions,   │
                              │   usage_data,    │
                              │   model_metrics) │
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  GitHub PR Comment│
                              │  (Baseline + Δ)   │
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  React Dashboard │
                              │  (D3.js + Vite)  │
                              └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Python 3.11 + FastAPI |
| **ML Engine** | scikit-learn (Random Forest) + PyTorch (LSTM) |
| **Database** | PostgreSQL 15 |
| **Frontend** | React 19 + Vite + D3.js |
| **Auth** | GitHub OAuth 2.0 |
| **Containerisation** | Docker + Docker Compose |
| **Code Analysis** | Python `ast` module |
| **AI Optimisation** | Google Gemini 2.5 Flash |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### 1. Clone & Configure
```bash
git clone <repo-url>
cd shadowstack
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/shadowstack_db
MODEL_PATH=../ml_pipeline/models/feature_pipeline2.pkl
LSTM_MODEL_PATH=../ml_pipeline/models/lstm_final_forecaster.pth
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
APP_DOMAIN=http://localhost:8000
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_POLLING_INTERVAL_MS=30000
VITE_GITHUB_CLIENT_ID=your_github_app_client_id
```

### 2. Start with Docker Compose
```bash
docker-compose up --build
```

Services:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Database:** localhost:5433

### 3. Generate Synthetic Training Data
```bash
cd ml_pipeline
python generate_data.py
```

This creates 50,000 rows of correlated complexity/cost data in PostgreSQL.

### 4. Train Models (Jupyter)
```bash
cd ml_pipeline/notebooks
jupyter notebook 02_model_training.ipynb
jupyter notebook 03_lstm_forecasting.ipynb
```

Trained artefacts are saved to `ml_pipeline/models/`.

---

## Key Features

### 🤖 AI-Powered PR Analysis
- **AST Parsing**: Real-time analysis of Python code complexity
- **Random Forest**: Predicts cost impact from complexity metrics
- **LSTM Forecasting**: 30-day forward-looking cost projections
- **Optimisation Recommendations**: Auto-generated advice based on code patterns

### 🔗 GitHub Integration
- **Webhook Automation**: Auto-triggers on PR open/synchronize/reopen
- **PR Comments**: Rich markdown with baseline, predicted, delta, and recommendations
- **OAuth Login**: Secure GitHub authentication with repo + webhook scopes
- **Multi-Tenant**: Per-repository token storage

### 📊 Real-Time Dashboard
- **D3.js Visualisations**: Area charts, trend lines, service breakdowns
- **Live Polling**: Updates every 30 seconds
- **Model Metrics**: MAE, RMSE, R² tracking
- **Alert System**: High-complexity and high-delta anomaly detection

---

## Project Structure

```
shadowstack/
├── backend/                 # FastAPI application
│   ├── main.py             # API endpoints, webhook handler, DB schema
│   ├── ast_analyzer.py     # Python AST complexity analyzer
│   ├── pricing_config.yaml # Mock cloud pricing tiers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React + Vite dashboard
│   ├── src/
│   │   ├── pages/          # Dashboard, Predictions, CostAnalysis, Settings
│   │   ├── components/     # D3Chart, Sidebar, Header, Layout
│   │   ├── hooks/          # useDashboardData (polling)
│   │   ├── services/       # apiClient (Axios)
│   │   └── context/        # AuthContext (GitHub OAuth)
│   ├── package.json
│   └── vite.config.js
├── ml_pipeline/            # ML training & inference
│   ├── generate_data.py    # Synthetic dataset generator
│   ├── inference.py        # Standalone inference script
│   ├── models/             # Trained model artefacts
│   └── notebooks/          # Jupyter training notebooks
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/github` | Exchange OAuth code for access token |
| `POST` | `/api/integrations/github/webhook` | Connect repo & register webhook |
| `POST` | `/api/predict` | Run cost prediction for a PR |
| `POST` | `/api/costs/forecast` | 30-day LSTM cost forecast |
| `POST` | `/api/analyze` | AST analysis for pasted code |
| `POST` | `/api/analyze-pr` | Full PR analysis (AST + Gemini AI + ML) |
| `GET` | `/api/github/prs` | List open PRs for connected repo |
| `GET` | `/api/github/prs/{n}/files` | Fetch changed files & diffs for a PR |
| `GET` | `/api/predictions` | List prediction history |
| `GET` | `/api/costs/history` | Dashboard KPIs & breakdowns |
| `GET` | `/api/model-metrics` | ML model performance (MAE, RMSE, R²) |
| `POST` | `/webhook/github` | GitHub PR webhook receiver |
| `GET` | `/health` | Health check |

---

## Performance Benchmarks

| Metric | Target | Status |
|--------|--------|--------|
| Load prediction accuracy | >75% | ✅ Achieved |
| Resource waste reduction | 20–30% | 🔄 In progress |
| PR prediction latency | <30 seconds | ✅ Achieved |
| Dashboard update interval | 15 seconds | ✅ 30s (configurable) |

---

## Team

| Role | Name | Responsibility |
|------|------|---------------|
| **Lead** | Aniruddha Bhide | Backend architecture, ML models, system orchestration |
| **Frontend** | Sanay Krishna | React dashboard, D3.js visualisations, API integration |
| **Data Engineering** | Arpita M | Synthetic dataset generation, technical documentation |

---

## License

This is an academic capstone project. Not intended for production use without further hardening.
