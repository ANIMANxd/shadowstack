# Project Modifications Log

## Sprint 2+ Completed Changes

### 1. AST Analysis Engine (`backend/ast_analyzer.py`)
- **NEW FILE**: Real Python AST parser using the `ast` module.
- Extracts: function count, loop count, nested loop count, branch count, cyclomatic complexity.
- Generates a normalised complexity score (1.0–10.0).
- Produces **actionable optimisation recommendations** based on code patterns:
  - Nested loop refactoring suggestions with estimated savings
  - Loop density warnings
  - Cyclomatic complexity advice
  - Branch simplification tips
- Supports multi-file aggregation for PRs with multiple changed files.

### 2. Mock Cloud Pricing Config (`backend/pricing_config.yaml`)
- **NEW FILE**: YAML-based pricing tiers mapping resource types to hourly USD rates.
- Covers: compute, database, storage, network, cache.
- Includes service-level multipliers for realistic cost estimation.
- Loaded dynamically by the backend at startup.

### 3. Enhanced Database Schema (`backend/main.py`)
- **`predictions` table**: Added `baseline_cost_usd`, `delta_usd`, `recommendation` columns.
- **`usage_data` table**: Added `repository_full_name` column for per-repo baseline queries.
- **`model_metrics` table**: **NEW TABLE** tracking `model_version`, `model_type`, `mae`, `rmse`, `r2`, `dataset_size`, `trained_at`.

### 4. Real AST-Driven Webhook Handler
- `POST /webhook/github` now performs **real code analysis**:
  1. Fetches the user's GitHub token from the `integrations` table.
  2. Retrieves changed files in the PR via GitHub API.
  3. Downloads raw Python file contents.
  4. Runs `ast_analyzer.analyze_files()` to extract real complexity metrics.
  5. Determines dominant service from file paths (heuristic: db→database, cache→cache, etc.).
  6. Calls `/api/predict` with **genuine AST-derived** `complexity_score` and `resource_units`.
  7. Updates the prediction record with detailed recommendations.

### 5. Rich PR Comments with Recommendations
- Comments now include a **markdown table** with:
  - Baseline monthly cost
  - Predicted monthly cost
  - Delta (+$X / -$X) with percentage
  - Complexity breakdown (functions, loops, branches, cyclomatic complexity)
  - **Optimisation recommendations** tailored to the code
  - Warning callout for deltas > $100

### 6. Model Metrics Endpoint
- **NEW**: `GET /api/model-metrics` returns latest ML performance (MAE, RMSE, R²).
- Frontend dashboard displays model version, type, error metrics, and dataset size.

### 7. Frontend Improvements
- **`useDashboardData.js`**: Now fetches `/api/model-metrics` and `/api/costs/forecast` (LSTM) in addition to existing endpoints.
- **`Dashboard.jsx`**:
  - 30-Day Forecast widget now renders a **real D3.js chart** from LSTM data instead of a placeholder.
  - Added **Model Metrics panel** showing MAE, RMSE, R², dataset size.
- **`Predictions.jsx`**:
  - Table now shows **Baseline**, **Predicted**, **Delta**, and **Risk** columns.
  - Rows are clickable to reveal the full optimisation recommendation.
  - 30-Day Forecast chart replaced placeholder with real LSTM data.
- **`CostAnalysis.jsx`**:
  - Summary cards now use **real prediction data** (total predicted, avg per PR, top service) instead of hardcoded mock values ($4,280, Lambda, etc.).
  - Trend chart is wired to live historical cost data.

### 8. Removed Empty Placeholder Pages
- **Resources page**: Deleted entirely (was a "Coming Soon" placeholder).
- **Alerts page**: Rewritten to show **real prediction anomalies** (high complexity / high delta) with severity badges.
- **Reports page**: Rewritten with **real data** — summary stats, risk distribution bars, service breakdown table, full prediction history.

### 9. PR Analyzer with Google Gemini AI (`frontend/src/pages/CodeAnalyzer/`)
- **Complete rewrite** of the Code Analyzer page into a **PR Analyzer**:
  - Automatically fetches **open PRs** from the connected GitHub repository.
  - Displays PR list with title, author, branch, date.
  - Shows **changed files** with expandable diff/patch views (color-coded: green additions, red deletions).
  - **"Analyse PR with AI"** button triggers the full analysis pipeline.
- **Backend pipeline (`POST /api/analyze-pr`)**:
  1. Fetches changed Python files from GitHub API.
  2. Runs **AST analysis** for complexity metrics.
  3. Runs **ML cost prediction** (Random Forest).
  4. Calculates **baseline vs predicted delta**.
  5. Sends code + metrics to **Google Gemini 2.5 Flash** for AI-powered optimisation suggestions.
  6. Persists results to the database.
  7. Returns AST metrics, cost prediction, and Gemini AI markdown suggestions.
- **Results panel** shows:
  - Cost cards: Baseline, Predicted, Delta
  - Complexity score, files analysed, service type
  - 6 AST metric badges
  - **Gemini AI suggestions** rendered as formatted markdown with code blocks
  - Falls back to rule-based recommendations if Gemini is unavailable.

### 10. Google Gemini Integration (`backend/gemini_analyzer.py`)
- **NEW FILE**: Gemini AI client using the official `google-genai` SDK (v1.73.1).
- Sends a structured prompt containing:
  - Changed Python code
  - AST complexity metrics
  - Predicted cost impact
- Gemini returns **3–5 specific optimisation recommendations** with:
  - Problem description
  - Refactored code examples
  - Estimated monthly dollar savings
- Uses `gemini-2.5-flash` model for fast, cost-effective inference.

### 11. Settings Cleanup
- Removed the **manual prediction card** entirely.
- Predictions are now **exclusively automatic** via GitHub webhooks or the PR Analyzer.
- Settings now only has: Repository Connection, Deployment Defaults, Account.

### 12. Infrastructure Fixes
- **`docker-compose.yml`**: Frontend service now properly builds and serves the Vite React app.
- **`backend/requirements.txt`**: Added `pyyaml` and `google-genai`.
- **`backend/.env`**: Added `GITHUB_WEBHOOK_SECRET`, `APP_DOMAIN`, `GEMINI_API_KEY`.
- **`README.md`**: Completely rewritten with proper setup instructions, architecture diagram, API endpoint table, and team info.
- **`CODEBASE.md`**: Updated to reflect the actual React + Vite architecture and all new files.

## Remaining Work (Sprint 3/4 Backlog)

- [ ] **Kubernetes Operator**: Go-based proactive auto-scaler (Sprint 3 stretch goal).
- [ ] **Kafka Integration**: Real-time event streaming between predictor and auto-scaler.
- [ ] **Stress Testing**: Verify <500ms P95 latency under load.
- [ ] **Next.js Migration**: Currently React + Vite; future migration to Next.js for SSR (optional).
