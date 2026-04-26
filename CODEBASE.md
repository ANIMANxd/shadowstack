# ShadowStack Codebase Overview

This document provides a comprehensive mapping of the directories and files within the ShadowStack repository. It serves as a quick reference guide to understand "what lives where" in the project.

## 📂 Root Directory
- **`CONTEXT.md`**: The master architectural document. Contains the project vision, technical stack, database schema definitions, performance benchmarks, and the sprint-wise development plan.
- **`CODEBASE.md`**: This file. A directory and file map of the entire project.
- **`modifications.md`**: A changelog detailing recent integrations, particularly the Sprint 3 backend modifications (GitHub OAuth, Webhooks, DB schema updates) and an implementation checklist for the team.
- **`docker-compose.yml`**: Infrastructure orchestration file. Used to spin up the local project environment (e.g., PostgreSQL/TimescaleDB, Redis, Kafka, and the FastAPI backend server).
- **`backend_health_check.py`**: A utility script to verify if the backend API and database connections are live and functioning correctly.
- **`README.md`**: The primary entry point for the repository. Usually contains setup instructions and quick-start commands.

## 📂 `backend/` (FastAPI Server)
*The core API serving ML predictions, handling database operations, and communicating with GitHub.*

- **`main.py`**: The central application file. It contains:
  - Startup/shutdown lifecycles (loading ML models into memory, creating DB tables).
  - Webhook endpoints (`POST /webhook/github`) for receiving GitHub PR events and validating HMAC signatures.
  - ML inference endpoints (`POST /api/predict`, `POST /api/costs/forecast`).
  - Frontend data endpoints (`GET /api/predictions`).
  - Integration endpoints (`POST /api/integrations/github/webhook`) for securely storing GitHub OAuth tokens and automatically registering repository webhooks.
  - Helper functions for talking to the GitHub API (`post_github_comment`).
- **`requirements.txt`**: Python dependencies for the backend (FastAPI, SQLAlchemy, Scikit-Learn, PyTorch, Pandas, etc.).
- **`Dockerfile`**: Instructions for containerizing the FastAPI backend.
- **`.env`** *(Not checked into source control)*: Contains environment secrets like `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, and ML model paths.

## 📂 `ml_pipeline/` (Machine Learning Engine)
*Scripts and training data for the Random Forest cost predictor and LSTM load forecaster.*

- **`generate_data.py`**: A script built by the Data Engineering role to generate the 50,000+ row synthetic dataset. Correlates AST code complexity with simulated resource usage and costs.
- **`inference.py`**: A standalone script to test model inferences without spinning up the FastAPI server. Useful for debugging model input/output shapes.
- **`check_cuda.py`**: A utility script to verify if PyTorch can see the local GPU (CUDA) to speed up LSTM training.
- **`data/`**: Directory containing the generated synthetic `.csv` files used for training.
- **`models/`**: The artifact directory for trained models.
  - `rf_cost_model_v1.joblib` / `rf_cost_model_v1_final.joblib`: The Random Forest pipeline artifacts.
  - `lstm_final_forecaster.pth` (and other variants): The PyTorch serialized weights for the LSTM time-series forecaster.
- **`notebooks/`**: Jupyter notebooks used for data exploration and iterative model training.
  - `02_model_training.ipynb`: Exploratory data analysis and Random Forest training.
  - `03_lstm_forecasting.ipynb`: Time-series data preparation and PyTorch LSTM training.

## 📂 `frontend/` (Next.js Application)
*The real-time dashboard UI for end-users, migrating from React to Next.js in Sprint 3.*

- **`README.md`**: Placeholder/setup instructions for the frontend package.
- *(Upcoming Files)*: Will contain the Auth.js/NextAuth configuration, Tailwind CSS components, the GitHub OAuth login flow, and D3.js visualizations hooked up to the backend `GET /api/predictions` endpoint.

## 📂 `docs/`
*General project documentation and meeting notes.*

- **`sprint1-notes.md`**: Developer notes and tasks tracking from the Sprint 1 phase.
