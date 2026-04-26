# ShadowStack: Predictive Cloud Cost Optimizer - Project Context

## 1. Project Identity & Vision
ShadowStack is a 3-credit capstone project for the BCA 6th Semester. It is an intelligent system that predicts infrastructure costs before code deployment and proactively scales resources based on learned patterns.

* **Problem Statement:** Existing tools like AWS Cost Explorer are reactive (reporting past spending), whereas ShadowStack is proactive.
* **The Goal:** Solve the $17.6B problem of cloud waste by catching expensive code changes in the PR phase and optimizing Kubernetes scaling using AI.

## 2. Core Features (The "What")
* **Code-to-Cost Analysis:** Automated AST parsing of Python code to detect expensive operations (loops, DB queries).
* **ML-Based Load Prediction:** LSTM neural networks trained on historical metrics to forecast load 1–24 hours in advance.
* **Proactive Auto-Scaler:** A custom Kubernetes Operator (written in Go) that scales infrastructure based on ML predictions rather than current CPU load.
* **GitHub Integration:** Automated markdown comments posted to Pull Requests: *"This change will increase monthly costs by $X"*.
* **Real-Time Dashboard:** A Next.js interface providing "cost per second" views and service-wise breakdowns.

## 3. Technical Stack
* **Backend:** Python (FastAPI) for the main API and Webhook listener; Go for the K8s Operator.
* **Frontend:** Next.js (migrated from React) with D3.js for real-time visualizations.
* **Machine Learning:** TensorFlow/PyTorch for LSTM load forecasting; XGBoost/Random Forest for anomaly detection and cost regression.
* **Data & Infra:** PostgreSQL 15 with TimescaleDB (time-series), Redis (caching), Kafka (event streaming), and Prometheus (metrics scraping).
* **Orchestration:** Kubernetes (K3s locally) and Docker Compose.

## 4. Database Schema (Primary Reference)
The agent must strictly follow the schema defined in `schemadesign-shadowstack.pdf`:
* **`usage_data`:** Tracks `pr_number`, `complexity_score` (1.0–10.0), and raw resource metrics.
* **`predictions`:** Stores `predicted_cost_usd`, `model_version`, and `is_comment_posted` status.
* **`model_metrics`:** Central table for tracking `mae`, `rmse`, and `r2` for every trained model.

## 5. Development Roles
* **Aniruddha Bhide (Lead):** Backend architecture, ML model development, and system orchestration.
* **Sanay Krishna:** Next.js frontend, API integration (Axios), and D3.js visualization.
* **Arpita M:** Data engineering, synthetic dataset generation (50,000+ rows), and technical documentation.

## 6. Performance Benchmarks (Success Criteria)
* **Accuracy:** Load prediction accuracy >75%.
* **Efficiency:** Demonstrate 20–30% reduction in resource waste.
* **Latency:** PR cost predictions must be delivered within 30 seconds.
* **Dashboard:** Real-time updates every 15 seconds.

## 7. Sprint-Wise Development Plan

### Sprint 1: Foundation & Infrastructure (Completed)
* **Goal:** Establish the 6-layer architecture and baseline communication.
* **Key Deliverables:** FastAPI setup, PostgreSQL/TimescaleDB migration, Docker Compose orchestration, GitHub Webhook listener (HMAC validation), and initial React scaffolding.

### Sprint 2: ML Pipeline & Data Engineering (Current)
* **Goal:** Transition from dummy data to intelligent predictions.
* **Key Deliverables:** * Generation of 50,000+ row synthetic dataset with correlated complexity/cost.
    * Feature extraction logic (AST parsing) to map code to metrics.
    * Implementation and training of LSTM and Random Forest models.
    * Development of the `/api/predict` endpoint and ML evaluation metrics (MAE, RMSE, R2).

### Sprint 3: Integration & Proactive Scaling (Upcoming)
* **Goal:** Connect the "Brain" to the "Body" and the "User."
* **Key Deliverables:** * Migration of frontend from React to Next.js for SSR performance.
    * Integration of the GitHub Bot to post automated cost-prediction comments.
    * Development of the custom Go-based Kubernetes Operator for proactive scaling.
    * Real-time data streaming via Kafka between the predictor and the auto-scaler.

### Sprint 4: Visualization, Optimization & Final Review
* **Goal:** Refine the user experience and verify business value.
* **Key Deliverables:** * Final D3.js dashboard with "Predicted vs. Actual" cost charts.
    * System stress testing and latency optimization (<500ms P95).
    * Final technical manual, deployment guide, and project report.

## 8. Operational Workflow
1.  **Ingestion:** GitHub Webhook receives a `pull_request` event.
2.  **Analysis:** System triggers AST Analysis to extract complexity metrics.
3.  **Prediction:** ML Engine generates a cost estimate based on `usage_data` history.
4.  **Reporting:** Results are stored in `predictions` and posted as a PR comment.
5.  **Optimization:** K8s Operator queries predictions to preemptively adjust pod replicas.

---
**Instruction for AI Agent:** Always prioritize modularity and asynchronous execution. Ensure all database operations utilize bulk insertion methods. When generating UI components, use Next.js server components for data fetching where applicable. Refer to Sprint 2 tasks for immediate implementation focus.