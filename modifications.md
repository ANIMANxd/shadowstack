# Project Modifications Log

## Recent Changes (Backend - Sprint 3 Integration)

### 1. GitHub Webhook Security & Trigger
- Updated `POST /webhook/github` endpoint to validate incoming GitHub payloads using `X-Hub-Signature-256` HMAC authentication against `GITHUB_WEBHOOK_SECRET`.
- Configured the webhook to correctly parse `pull_request` events (opened, synchronize, reopened) and trigger the ML pipeline (`predict_cost`).
- Moved the ML prediction to run as a FastAPI `BackgroundTask` to ensure immediate 202 Acceptance responses to GitHub, preventing timeouts.

### 2. Automated PR Commenting
- Built a `post_github_comment` helper utilizing Python's native `urllib` (avoiding extra library dependencies).
- Integrated comment posting directly into the `predict_cost` workflow so that once a cost prediction is generated, it is automatically posted as a markdown comment on the originating GitHub PR.

### 3. Frontend Data Endpoint
- Created `GET /api/predictions` to serve prediction history for the upcoming Next.js real-time dashboard. Features descending chronological ordering and timestamp formatting.

### 4. Dynamic GitHub OAuth Integration
- Added an `integrations` table to PostgreSQL via the startup script to securely store `repository_full_name` and user-specific `github_access_token`s.
- Created `POST /api/integrations/github/webhook` for the frontend to register active GitHub tokens. This endpoint automatically communicates with the GitHub REST API to provision our webhook URL (`/webhook/github`) on the target repository.
- Upgraded `post_github_comment` to dynamically query the database for the specific repository's access token, making the system multi-tenant rather than relying on a single global `.env` token.

---

## What Needs to be Done Next

### Frontend (Next.js - Sprint 3)
- [ ] **GitHub OAuth Integration**: Implement NextAuth.js (Auth.js) using the GitHub Provider. Must explicitly request the `repo` and `admin:repo_hook` scopes.
- [ ] **Session Token Extraction**: Configure NextAuth `jwt` and `session` callbacks to surface the user's raw GitHub `access_token` to the client.
- [ ] **Integration UI**: Build a page for authenticated users to enter their GitHub repo (e.g., `owner/repo`) and connect it. Wire the button to securely pass the repo name and `access_token` to the Python backend's `POST /api/integrations/github/webhook`.
- [ ] **Dashboard UI**: Design and build the real-time cost tracking dashboard utilizing Next.js Server Components and D3.js, pulling data from `GET /api/predictions`.

### Infrastructure & Proactive Scaling (Sprint 3/4)
- [ ] **AST Analysis**: Implement the actual Python AST parsing to dynamically calculate the `complexity_score` for PR changes instead of passing mocked/static score data.
- [ ] **Kafka Integration**: Setup real-time event streaming of prediction data bridging the FastAPI backend and external components.
- [ ] **K8s Operator**: Develop the custom Go-built Kubernetes Operator to adjust actual pod replicas proactively based on the LSTM/Random Forest predictions.
