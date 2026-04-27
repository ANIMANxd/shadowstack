# ShadowStack – Product Demo Guide

> **Purpose:** This guide explains what ShadowStack does and provides a complete, step-by-step walkthrough for giving a flawless product demo — from a blank slate to a live, working system.

---

## Table of Contents

1. [What is ShadowStack?](#what-is-shadowstack)
2. [System Architecture Overview](#system-architecture-overview)
3. [Pre-Demo Checklist](#pre-demo-checklist)
4. [Step 1: Environment Setup](#step-1-environment-setup)
5. [Step 2: Database Preparation](#step-2-database-preparation)
6. [Step 3: Start the System](#step-3-start-the-system)
7. [Step 4: Create a Demo GitHub Repository](#step-4-create-a-demo-github-repository)
8. [Step 5: Connect ShadowStack to Your Repo](#step-5-connect-shadowstack-to-your-repo)
9. [Step 6: Create a Pull Request with Python Code](#step-6-create-a-pull-request-with-python-code)
10. [Step 7: Observe the Webhook Flow](#step-7-observe-the-webhook-flow)
11. [Step 8: Explore the Dashboard](#step-8-explore-the-dashboard)
12. [Step 9: Use Test / Demo Endpoints](#step-9-use-test--demo-endpoints)
13. [Troubleshooting](#troubleshooting)

---

## What is ShadowStack?

ShadowStack is an **AI-powered predictive cloud cost optimizer**. Unlike existing tools (e.g., AWS Cost Explorer) that are **reactive** — telling you what you already spent — ShadowStack is **proactive**:

- **Code-to-Cost Analysis:** It parses Python code via Abstract Syntax Tree (AST) analysis to detect expensive operations (nested loops, heavy DB queries) **before** they are deployed.
- **ML-Based Load Prediction:** It uses LSTM neural networks trained on historical metrics to forecast infrastructure load 1–24 hours in advance.
- **Proactive Auto-Scaler:** A custom Kubernetes operator scales resources based on ML predictions rather than current CPU load.
- **GitHub Integration:** It posts automated cost-prediction comments directly on Pull Requests: *"This change will increase monthly costs by $X."*
- **Real-Time Dashboard:** A Next.js frontend provides "cost per second" views, service-wise breakdowns, and anomaly alerts.

**The Goal:** Solve the $17.6B problem of cloud waste by catching expensive code changes in the PR phase.

---

## System Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub PR     │────▶│  ShadowStack     │────▶│   PostgreSQL    │
│   (Webhook)     │     │  FastAPI Backend │     │   + TimescaleDB │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  ML Pipeline     │
                        │  • Random Forest │
                        │  • LSTM Forecast │
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Next.js         │
                        │  Dashboard       │
                        └──────────────────┘
```

**Key Components:**
- **Backend:** Python (FastAPI) – API, webhook listener, AST analyzer, ML inference
- **Frontend:** Next.js (React + Vite) – Real-time dashboard with D3.js visualizations
- **ML Models:** Random Forest (cost regression) + LSTM (30-day cost forecasting)
- **Database:** PostgreSQL 15 with TimescaleDB extension for time-series data
- **Orchestration:** Docker Compose (local) / Kubernetes (production)

---

## Pre-Demo Checklist

Before starting the demo, ensure you have:

- [ ] **Docker Desktop** installed and running
- [ ] **Git** installed
- [ ] A **GitHub account** (for creating demo repos and OAuth)
- [ ] A **GitHub Personal Access Token** with `repo` and `admin:repo_hook` scopes
- [ ] The ShadowStack repo cloned: `git clone <repo-url>`
- [ ] Checked out the correct branch: `release/sprint-4-integrated`

---

## Step 1: Environment Setup

### 1.1 Clone and Checkout

```bash
git clone <your-shadowstack-repo-url>
cd shadowstack
git checkout release/sprint-4-integrated
```

### 1.2 Configure Backend Environment

The `docker-compose.yml` already sets `APP_ENV=development` for the backend, which enables the test endpoints. However, if running the backend locally (outside Docker), copy and configure:

```bash
cd backend
cp .env .env.local   # optional, for local overrides
```

Ensure these key variables are set in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shadowstack_db
MODEL_PATH=../ml_pipeline/models/feature_pipeline2.pkl
LSTM_MODEL_PATH=../ml_pipeline/models/lstm_final_forecaster.pth
GITHUB_CLIENT_ID=Ov23liCDviIEhUMqdNIc
GITHUB_CLIENT_SECRET=<your-secret>
GITHUB_WEBHOOK_SECRET=shadowstack_webhook_secret_2026
APP_DOMAIN=http://localhost:8000
APP_ENV=development
GEMINI_API_KEY=<your-gemini-key>
```

> **Note:** `APP_ENV=development` is **required** for the `/api/test/*` endpoints to work.

### 1.3 Configure Frontend Environment

The frontend `.env` is pre-configured:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_POLLING_INTERVAL_MS=30000
VITE_GITHUB_CLIENT_ID=Ov23liCDviIEhUMqdNIc
```

---

## Step 2: Database Preparation

If you are starting with a **fresh PostgreSQL database**, ensure the required columns exist. Run these SQL commands **once** after the containers start:

```bash
docker exec -it shadowstack-db-1 psql -U postgres -d shadowstack_db
```

Then execute:

```sql
-- Fix predictions table (add missing columns if they don't exist)
ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS baseline_cost_usd DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delta_usd DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- Fix usage_data table (add missing column if it doesn't exist)
ALTER TABLE usage_data
    ADD COLUMN IF NOT EXISTS repository_full_name TEXT;
```

> **Why this is needed:** The auto-created schema in `main.py` uses SQLite syntax (`AUTOINCREMENT`) which fails on PostgreSQL. The tables are typically created via migration scripts or manually. These ALTER statements ensure the backend code can write predictions successfully.

---

## Step 3: Start the System

### 3.1 Build and Start All Services

From the project root:

```bash
docker compose up --build -d
```

Wait for all services to be healthy:

```bash
docker compose ps
```

You should see:
- `shadowstack-db-1`       → `healthy`
- `shadowstack-backend-1`  → `running`
- `shadowstack-frontend-1` → `running`

### 3.2 Verify Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "model_loaded": true,
  "lstm_loaded": true,
  "service": "ShadowStack Backend",
  "version": "2.1.0"
}
```

### 3.3 Verify Demo Status

```bash
curl http://localhost:8000/api/test/demo-status
```

Expected response:
```json
{
  "db_connected": true,
  "predictions_count": 0,
  "integrations_count": 0,
  "models_loaded": true,
  "gemini_configured": true,
  "latest_prediction": null
}
```

### 3.4 Open the Frontend

Navigate to **http://localhost:3000** in your browser. You should see the ShadowStack dashboard loading.

---

## Step 4: Create a Demo GitHub Repository

### 4.1 Create the Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it: `shadowstack-demo-repo`
3. Make it **Public** (easier for webhooks)
4. Add a README
5. Click **Create repository**

### 4.2 Clone It Locally

```bash
cd ..
git clone https://github.com/<your-username>/shadowstack-demo-repo.git
cd shadowstack-demo-repo
```

### 4.3 Add a Sample Python File

Create a file called `app.py` with some intentionally complex code so ShadowStack has something to analyze:

```python
# app.py — A deliberately complex demo script for ShadowStack analysis

def process_data(items):
    """O(n²) nested loop — expensive!"""
    total = 0
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] > items[j]:
                total += items[i] * items[j]
            elif items[i] == items[j]:
                total += items[i]
    return total


def query_database():
    """Simulates a heavy database query."""
    results = []
    for i in range(1000):
        if i % 2 == 0:
            results.append(i * 2)
        elif i % 3 == 0:
            results.append(i * 3)
        else:
            results.append(i)
    return results


def helper():
    x = 1
    while x < 100:
        x *= 2
    return x


if __name__ == "__main__":
    data = [1, 2, 3, 4, 5]
    print(process_data(data))
    print(query_database())
    print(helper())
```

Commit and push:

```bash
git add app.py
git commit -m "feat: add initial app.py for demo"
git push origin main
```

---

## Step 5: Connect ShadowStack to Your Repo

### 5.1 Generate a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scopes:
   - `repo` (full control of private repositories)
   - `admin:repo_hook` (full control of repository hooks)
4. Click **Generate token**
5. **Copy the token immediately** — you won't see it again!

### 5.2 Connect via the Frontend

1. Open **http://localhost:3000**
2. Navigate to **Settings** (gear icon or sidebar)
3. Find the **GitHub Integration** section
4. Enter:
   - **Repository:** `your-username/shadowstack-demo-repo`
   - **Access Token:** `<paste-your-token-here>`
5. Click **Connect**

The frontend will POST to `/api/integrations/github/webhook`, which:
- Saves your token in the PostgreSQL `integrations` table
- Registers a webhook on your GitHub repo for `pull_request` events

### 5.3 Verify the Integration

```bash
curl http://localhost:8000/api/test/demo-status
```

You should now see:
```json
{
  "integrations_count": 1,
  ...
}
```

---

## Step 6: Create a Pull Request with Python Code

### 6.1 Create a Feature Branch

```bash
git checkout -b feature/add-expensive-code
```

### 6.2 Modify `app.py`

Make the code even more complex:

```python
# app.py — Even MORE expensive!

def process_data(items):
    """O(n²) nested loop — expensive!"""
    total = 0
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] > items[j]:
                total += items[i] * items[j]
            elif items[i] == items[j]:
                total += items[i]
    return total


def query_database():
    """Simulates a heavy database query."""
    results = []
    for i in range(10000):  # INCREASED from 1000 to 10000
        if i % 2 == 0:
            results.append(i * 2)
        elif i % 3 == 0:
            results.append(i * 3)
        else:
            results.append(i)
    return results


def new_expensive_function(matrix):
    """Triple nested loop — very expensive!"""
    result = []
    for row in matrix:
        for cell in row:
            for k in range(100):
                if cell + k > 50:
                    result.append(cell * k)
    return result


def helper():
    x = 1
    while x < 1000:  # INCREASED from 100 to 1000
        x *= 2
    return x


if __name__ == "__main__":
    data = [1, 2, 3, 4, 5]
    matrix = [[1, 2], [3, 4], [5, 6]]
    print(process_data(data))
    print(query_database())
    print(new_expensive_function(matrix))
    print(helper())
```

### 6.3 Commit and Push

```bash
git add app.py
git commit -m "feat: add expensive nested loops and larger queries"
git push origin feature/add-expensive-code
```

### 6.4 Open a Pull Request

1. Go to your GitHub repo: `https://github.com/your-username/shadowstack-demo-repo`
2. Click **Compare & pull request**
3. Title: `feat: add expensive operations`
4. Description: `This PR adds some complex nested loops and larger DB query simulations.`
5. Click **Create pull request**

---

## Step 7: Observe the Webhook Flow

### 7.1 What Happens Automatically

When you create the PR, GitHub sends a `pull_request` webhook to ShadowStack. The backend:

1. **Validates** the webhook signature (HMAC-SHA256)
2. **Fetches** the changed Python files from the PR via GitHub API
3. **Runs AST Analysis** to extract:
   - Function count
   - Loop count (including nested loops)
   - Branch count
   - Cyclomatic complexity
   - Complexity score (1–10)
4. **Runs ML Prediction** using the Random Forest model
5. **Generates** a rich markdown PR comment with cost analysis
6. **Posts** the comment back to the PR (if a token exists)
7. **Stores** the prediction in the `predictions` table

### 7.2 Check the PR Comment

Go back to your GitHub PR page. Within 10–30 seconds, you should see a new comment from ShadowStack like:

> ## 🤖 ShadowStack Cost Analysis
> | Metric | Value |
> |--------|-------|
> | **Baseline Monthly Cost** | `$15,000.00` |
> | **Predicted Monthly Cost** | `$X,XXX.XX` |
> | **Delta** | 🔴 `+$X,XXX.XX` (+X.X%) |
> | **Service** | compute |
> | **Resource** | t3.medium |
> | **Complexity Score** | 8.5/10 |
>
> ### 📊 Code Complexity Breakdown
> - **Functions:** 5
> - **Loops:** 6 (2 nested)
> - **Branches:** 6
> - **Cyclomatic Complexity:** 18
>
> ### 💡 Optimisation Recommendations
> - 🔴 **Refactor nested loops** — 2 nested loop(s) detected...
> - 🟡 **Reduce loop density** — 6 total loops...

### 7.3 Verify in the API

```bash
curl http://localhost:8000/api/predictions
```

You should see your prediction in the `data` array.

---

## Step 8: Explore the Dashboard

### 8.1 KPI Cards

The dashboard shows four key metrics:
- **Total Predicted Spend** — Sum of all predicted costs
- **Prediction Count** — Total number of predictions made
- **Avg Complexity** — Average complexity score across all predictions
- **Efficiency Score** — Derived from complexity (higher is better)

### 8.2 Historical Costs Chart

A 30-day line chart showing predicted vs. actual costs over time.

### 8.3 Service Breakdown

A donut chart showing cost distribution by service (compute, database, storage, etc.).

### 8.4 Alerts Panel

Real-time alerts generated from predictions:
- High complexity (> 7.0)
- High cost delta (> $200)
- General monitoring stats

### 8.5 Top Resources

A ranked list of the most expensive resources by predicted cost.

### 8.6 Model Metrics

Displays the latest ML model performance (MAE, RMSE, R²) from the `model_metrics` table.

---

## Step 9: Use Test / Demo Endpoints

ShadowStack provides three test endpoints (only in `APP_ENV=development`) to make demo rehearsals easier.

### 9.1 Check Demo Status

```bash
curl http://localhost:8000/api/test/demo-status
```

Returns:
```json
{
  "db_connected": true,
  "predictions_count": 3,
  "integrations_count": 1,
  "models_loaded": true,
  "gemini_configured": true,
  "latest_prediction": { ... }
}
```

### 9.2 Simulate a Webhook

Trigger a prediction **without** creating a real GitHub PR:

```bash
curl -X POST http://localhost:8000/api/test/simulate-webhook \
  -H "Content-Type: application/json" \
  -d '{"repo": "test/repo", "complexity_score": 6.5}'
```

Returns:
```json
{"status": "simulation triggered", "prediction_id": 42}
```

This runs the **exact same** `predict_cost` function that real webhooks trigger.

### 9.3 Reset Demo Data

Clear all predictions for a clean slate:

```bash
curl -X DELETE http://localhost:8000/api/test/reset-demo
```

Returns:
```json
{"status": "reset complete", "rows_deleted": 5}
```

---

## Troubleshooting

### Issue: Backend returns 500 on simulate-webhook

**Cause:** PostgreSQL transaction aborted due to a pre-existing schema mismatch.

**Fix:** Run the ALTER TABLE commands in [Step 2](#step-2-database-preparation).

### Issue: Webhook not firing

**Cause:** GitHub webhook not registered or the repo is private without proper token scopes.

**Fix:**
1. Check repo Settings → Webhooks on GitHub
2. Verify the webhook URL points to `http://your-ngrok-or-domain/webhook/github`
3. For local demos, use **ngrok**: `ngrok http 8000`
4. Update `APP_DOMAIN` in `.env` to the ngrok URL

### Issue: PR comment not posted

**Cause:** No GitHub token stored in the `integrations` table.

**Fix:** Re-connect the repository via the frontend Settings page.

### Issue: Frontend shows "Backend unreachable — falling back to mock data"

**Cause:** The frontend can't reach `localhost:8000`.

**Fix:**
1. Ensure the backend container is running: `docker compose ps`
2. Check `VITE_API_BASE_URL` in `frontend/.env`
3. If using Docker Desktop on Windows/Mac, try `http://host.docker.internal:8000`

### Issue: Models show as `model_loaded: false`

**Cause:** `MODEL_PATH` or `LSTM_MODEL_PATH` doesn't point to valid files.

**Fix:**
```bash
ls ml_pipeline/models/
# Should show: feature_pipeline2.pkl  lstm_final_forecaster.pth
```

---

## Quick Demo Script (5-Minute Version)

For a lightning-fast demo, use only the test endpoints:

```bash
# 1. Start everything
docker compose up --build -d

# 2. Verify health
curl http://localhost:8000/health

# 3. Check status
curl http://localhost:8000/api/test/demo-status

# 4. Trigger 3 simulated predictions
curl -X POST http://localhost:8000/api/test/simulate-webhook -H "Content-Type: application/json" -d '{"repo":"demo/acme","complexity_score":8.5}'
curl -X POST http://localhost:8000/api/test/simulate-webhook -H "Content-Type: application/json" -d '{"repo":"demo/acme","complexity_score":4.2}'
curl -X POST http://localhost:8000/api/test/simulate-webhook -H "Content-Type: application/json" -d '{"repo":"demo/beta","complexity_score":9.1}'

# 5. View predictions
curl http://localhost:8000/api/predictions

# 6. Open dashboard
open http://localhost:3000

# 7. Reset when done
curl -X DELETE http://localhost:8000/api/test/reset-demo
```

---

## Summary

ShadowStack bridges the gap between **code** and **cloud cost**. By analyzing Pull Requests before they are merged, it empowers engineering teams to:

1. **Catch expensive changes early** — in the PR review phase
2. **Get AI-powered recommendations** — for code optimization
3. **Predict future costs** — with 30-day LSTM forecasts
4. **Visualize spending** — in a real-time, interactive dashboard

Happy demoing! 🚀
