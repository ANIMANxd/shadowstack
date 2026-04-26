# ShadowStack Codebase Overview

This document provides a comprehensive mapping of the directories and files within the ShadowStack repository.

## Root Directory

- **`CONTEXT.md`**: Master architectural document with project vision, technical stack, database schema, performance benchmarks, and sprint-wise development plan.
- **`WHAT_IT_DOES.md`**: Detailed explanation of the core workflow and system behaviour.
- **`CODEBASE.md`**: This file — directory and file map.
- **`README.md`**: Setup instructions, quick-start commands, and project overview.
- **`docker-compose.yml`**: Full local orchestration (PostgreSQL, FastAPI backend, React frontend).
- **`backend_health_check.py`**: Utility script to verify backend API and database connections.

## `backend/` — FastAPI Server

The core API serving ML predictions, handling database operations, and communicating with GitHub.

- **`main.py`**: Central application file containing:
  - Startup/shutdown lifecycles (ML model loading, DB table creation)
  - Webhook endpoint (`POST /webhook/github`) with HMAC-SHA256 validation
  - ML inference endpoints (`POST /api/predict`, `POST /api/costs/forecast`)
  - AI analysis endpoint (`POST /api/analyze-pr`) combining AST + Gemini + ML
  - GitHub PR fetching endpoints (`GET /api/github/prs`, `GET /api/github/prs/{n}/files`)
  - Frontend data endpoints (`GET /api/predictions`, `GET /api/costs/history`, `GET /api/model-metrics`)
  - Integration endpoints (`POST /api/integrations/github/webhook`) for OAuth token storage and webhook registration
  - AST-driven background analysis for PR events
- **`ast_analyzer.py`**: Python AST parser that extracts complexity metrics (functions, loops, branches, cyclomatic complexity) and generates rule-based optimisation recommendations.
- **`gemini_analyzer.py`**: Google Gemini AI integration using `google-genai` SDK. Sends code + AST metrics to Gemini 2.5 Flash and returns intelligent, actionable cost optimisation suggestions with refactored code examples.
- **`pricing_config.yaml`**: Mock cloud pricing tiers mapping resource types to hourly USD rates (compute, database, storage, network, cache).
- **`requirements.txt`**: Python dependencies (FastAPI, SQLAlchemy, scikit-learn, PyTorch, Pandas, PyYAML, google-genai).
- **`Dockerfile`**: Container build for the FastAPI backend.
- **`.env`**: Environment secrets (DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_WEBHOOK_SECRET, MODEL_PATH, LSTM_MODEL_PATH, GEMINI_API_KEY).

## `frontend/` — React + Vite Dashboard

The real-time dashboard UI for end-users.

- **`src/pages/`**:
  - `Dashboard/Dashboard.jsx`: Main overview with KPIs, D3.js spend trend chart, service breakdown, alerts, top resources, 30-day forecast, and model metrics panel.
  - `Predictions/Predictions.jsx`: PR prediction table with baseline/predicted/delta/risk columns, clickable rows showing recommendations, and LSTM forecast chart.
  - `CostAnalysis/CostAnalysis.jsx`: Historical cost breakdown with real data-derived summary cards and interactive trend chart.
  - `CodeAnalyzer/CodeAnalyzer.jsx`: **PR Analyzer** — fetches open PRs from connected GitHub repo, displays changed files with expandable diffs, runs on-demand AST + Gemini AI + ML cost analysis.
  - `Alerts/Alerts.jsx`: Real-time anomaly alerts from prediction history (high complexity / high delta).
  - `Reports/Reports.jsx`: Executive summary with risk distribution, service breakdown, and full prediction history table.
  - `Settings/Settings.jsx`: Repository connection, deployment defaults, and account management.
  - `Login/Login.jsx`: GitHub OAuth entry point with animated UI.
  - `Callback/Callback.jsx`: OAuth redirect handler exchanging code for token.
- **`src/components/`**:
  - `D3Chart/D3Chart.jsx`: Reusable D3.js area chart with tooltips and responsive sizing.
  - `Layout/Layout.jsx`: Root shell with sidebar, header, and route rendering.
  - `Sidebar/Sidebar.jsx`: Collapsible navigation with inline SVG icons.
  - `Header/Header.jsx`: Top bar with live status, notifications, and user dropdown.
  - `ProtectedRoute/ProtectedRoute.jsx`: Auth gate for dashboard routes.
- **`src/hooks/useDashboardData.js`**: Custom React hook polling `/api/predictions`, `/api/costs/history`, `/api/model-metrics`, and `/api/costs/forecast` every 30 seconds.
- **`src/services/apiClient.js`**: Centralised Axios instance with interceptors, retry logic, and custom error handling.
- **`src/context/AuthContext.jsx`**: Global auth state managing GitHub OAuth tokens and user profiles.
- **`src/data/mockData.js`**: Fallback mock data used when backend is unreachable during development.
- **`package.json`**: Dependencies (React 19, Vite, D3, Axios, React Router).

## `ml_pipeline/` — Machine Learning Engine

Scripts, training data, and model artefacts.

- **`generate_data.py`**: Generates the 50,000+ row synthetic dataset correlating AST code complexity with simulated resource usage and costs. Inserts directly into PostgreSQL.
- **`inference.py`**: Standalone script to test model inferences without spinning up the FastAPI server.
- **`check_cuda.py`**: Utility to verify PyTorch GPU (CUDA) availability.
- **`models/`**: Trained model artefacts:
  - `feature_pipeline2.pkl`: Random Forest pipeline (primary production model).
  - `lstm_final_forecaster.pth`: PyTorch LSTM time-series forecaster weights.
- **`notebooks/`**: Jupyter notebooks for exploratory training:
  - `02_model_training.ipynb`: Random Forest training and evaluation.
  - `03_lstm_forecasting.ipynb`: LSTM time-series model training.

## `docs/`

- **`schemadesign-shadowstack.pdf`**: Official database schema design document.
- **`srs-document-shadowstack.pdf`**: Software Requirements Specification.
- **`product-backlog.pdf`**: Sprint backlog and task tracking.
- **`sprint1-notes.md`**: Sprint 1 developer notes.
