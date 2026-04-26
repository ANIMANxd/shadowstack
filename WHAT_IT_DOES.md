# ShadowStack — What This Project Actually Does

## Overview

ShadowStack is an **AI-powered, predictive cloud cost optimization platform** that catches expensive infrastructure changes **before** they are merged into production. It bridges the gap between code changes and cloud spending by analyzing Pull Requests in real-time, predicting their cost impact using Machine Learning, and automatically providing actionable feedback to developers.

Unlike reactive tools (like AWS Cost Explorer) that tell you what you *already* spent, ShadowStack is **proactive** — it tells you what you *will* spend if you merge a specific code change.

> **Note:** While the examples below reference Python, ShadowStack is designed to support multiple programming languages. Python is used here as the primary example.

---

## The Core Workflow

Here is exactly what happens when a developer opens a Pull Request:

### Step 1: PR Event Capture
A developer opens a GitHub Pull Request containing code changes.

ShadowStack receives that PR event via a **GitHub Webhook**.
- The webhook payload is validated using **HMAC-SHA256** to ensure authenticity and security.
- The system only processes events from repositories that have been explicitly connected by the user.

### Step 2: Static Code Analysis
The backend runs **Abstract Syntax Tree (AST) analysis** on the changed files.
- It extracts complexity metrics such as:
  - Function count
  - Loop count (for, while, nested loops)
  - Branch count (if/else, switch/case)
  - Cyclomatic complexity score (scaled 1–10)
- These metrics quantify how computationally expensive the new code is likely to be.

### Step 3: Cost Prediction (Random Forest)
The extracted complexity metrics are fed into a **Random Forest ML model**.
- The model predicts the **monthly infrastructure cost impact** of that specific code change in **USD**.
- It maps code complexity patterns to resource consumption using a **mocked cloud pricing tier system** (YAML-based configuration), covering:
  - Compute (CPU/RAM)
  - Storage
  - Network egress

> **No live AWS API is called.** Pricing is deterministic and based on the internal YAML config.

### Step 4: Trend Forecasting (LSTM)
Separately, a **Multi-Step LSTM (Long Short-Term Memory)** neural network:
- Analyzes historical usage data from the database
- Forecasts the **30-day cost trend** if the PR is merged
- This provides a forward-looking view beyond just the immediate impact

### Step 5: Automated PR Comment
The system automatically posts a **markdown comment** on the GitHub Pull Request **before it is merged**, containing:
- **Baseline cost**: Current monthly infrastructure cost
- **Predicted cost**: Estimated cost after merging the PR
- **Delta**: The cost difference (+$X / -$X)
- **Optimisation recommendation**: Actionable advice on how to reduce the cost impact (e.g., "Reduce nested loops to save ~$12/month")

### Step 6: Data Persistence
All predictions are stored in a **PostgreSQL** database in the `predictions` table, including:
- PR number and repository
- Predicted cost and delta
- Model version used
- Whether the comment was successfully posted
- Timestamp

---

## The Dashboard (React + Vite + D3.js)

A real-time web dashboard provides full visibility into cost metrics:

- **Polls `/api/predictions` every 30 seconds** for live updates
- **Visualisations powered by D3.js**:
  - Cost trends over time (line charts)
  - Service-wise cost breakdown (stacked bar / pie charts)
  - Predicted vs. Actual variance (accuracy tracking)
  - ML Model performance metrics (MAE, RMSE, R² scores)

The dashboard helps teams monitor whether the ML predictions are accurate and where money is being spent.

---

## Authentication & Multi-Tenancy

- Users authenticate via **GitHub OAuth**
- After login, they connect their repository via a **Settings page**
- The backend **auto-registers the webhook** on that repository using the GitHub API
- A **per-repo GitHub access token** is securely stored in an `integrations` table
- The system is **multi-tenant**: it supports multiple users and multiple repositories, keeping all data isolated per tenant

---

## How Pricing Works

ShadowStack does **not** connect to live cloud provider APIs (AWS, GCP, Azure). Instead, it uses an internal **YAML configuration file** that defines mocked cloud pricing tiers. The mapping works as follows:

| Complexity Signal | Resource Impact | Cost Driver |
|-------------------|-----------------|-------------|
| High loop count | Increased CPU time | Compute |
| Deep nesting / recursion | Higher memory usage | Compute / RAM |
| Database queries | I/O and latency | Storage / Network |
| Branching logic | Path-dependent scaling | Compute |

The Random Forest model learns the correlation between these code-level signals and the mocked USD costs, producing a realistic estimate of infrastructure impact.

---

## Key Differentiators

| Feature | Traditional Tools | ShadowStack |
|---------|-------------------|-------------|
| Timing | Reactive (post-deployment) | Proactive (pre-merge) |
| Integration | Requires manual checks | Automatic PR comments |
| Granularity | Service-level billing | Code-level cost attribution |
| Forecasting | Historical trends only | ML-based 30-day trend prediction |
| Actionability | "You spent $500" | "This loop will cost $50/month — consider refactoring" |

---

## System Architecture at a Glance

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
                              │   integrations)  │
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  GitHub PR Comment│
                              │  (Markdown Report)│
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  React Dashboard │
                              │  (D3.js + Vite)  │
                              └──────────────────┘
```

---

## Summary

ShadowStack turns code review into a **financial gate**. By the time a reviewer looks at a Pull Request, ShadowStack has already:

1. Analysed the code for complexity
2. Predicted its infrastructure cost in USD
3. Forecasted the 30-day spending trend
4. Posted a detailed comment with recommendations

It helps teams solve the **$17.6 billion cloud waste problem** by shifting cost awareness **left** — directly into the developer workflow.
