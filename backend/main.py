from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
import numpy as np
import joblib
import torch
import torch.nn as nn
import os
import logging

load_dotenv()  # loads backend/.env into os.environ

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- ML Model (loaded once at startup) ---
ml_model = None
MODEL_VERSION = "rf_v1"

# --- LSTM Forecaster ---
LSTM_VERSION = "lstm_final_v1"
lstm_model = None

class ShadowStackMultiLSTM(nn.Module):
    """Mirrors the architecture used in notebooks/03_lstm_forecasting.ipynb."""
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(1, 64, 2, batch_first=True)
        self.fc   = nn.Linear(64, 30)

    def forward(self, x):
        # create hidden/cell states on the same device as the input
        h0 = torch.zeros(2, x.size(0), 64, device=x.device)
        c0 = torch.zeros(2, x.size(0), 64, device=x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Startup / Shutdown lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_model, lstm_model

    # Load the trained RF pipeline
    model_path = os.getenv("MODEL_PATH")
    if not model_path:
        raise RuntimeError("MODEL_PATH is not set. Add it to backend/.env")
    try:
        ml_model = joblib.load(model_path)
        logger.info(f"✅ RF model loaded from: {model_path}")
    except Exception as e:
        logger.error(f"❌ Could not load RF model from '{model_path}': {e}")

    # Load the trained LSTM forecaster
    lstm_path = os.getenv("LSTM_MODEL_PATH")
    if not lstm_path:
        logger.warning("⚠️  LSTM_MODEL_PATH not set — /api/costs/forecast will be unavailable.")
    else:
        try:
            lstm_model = ShadowStackMultiLSTM()
            lstm_model.load_state_dict(
                torch.load(lstm_path, map_location=torch.device("cpu"), weights_only=True)
            )
            lstm_model.eval()
            logger.info(f"✅ LSTM forecaster loaded from: {lstm_path}")
        except Exception as e:
            logger.error(f"❌ Could not load LSTM model from '{lstm_path}': {e}")

    # Ensure predictions table exists (dev-mode safe — skips if DB offline)
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id                 SERIAL PRIMARY KEY,
                    pr_number          INTEGER,
                    complexity_score   FLOAT,
                    resource_units     FLOAT,
                    service_name       VARCHAR(100),
                    resource_type      VARCHAR(100),
                    predicted_cost_usd FLOAT       NOT NULL,
                    model_version      VARCHAR(50)  DEFAULT 'rf_v1',
                    is_comment_posted  BOOLEAN      DEFAULT FALSE,
                    created_at         TIMESTAMP    DEFAULT NOW()
                )
            """))
            conn.commit()
            logger.info("✅ 'predictions' table ensured.")
    except Exception as e:
        logger.warning(f"⚠️  DB setup skipped (DB may be offline in dev mode): {e}")

    yield  # app runs here

app = FastAPI(
    title="ShadowStack API",
    description="Predictive Cloud Cost Optimizer — Sprint 2",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    pr_number: int = Field(..., example=101)
    complexity_score: float = Field(..., ge=1.0, le=10.0, example=5.5,
                                    description="AST-derived complexity score (1–10)")
    resource_units: float = Field(..., gt=0, example=200.0,
                                  description="Normalised resource units from usage_data")
    service_name: str = Field(..., example="compute",
                              description="Service category, e.g. compute / database / storage")
    resource_type: str = Field(..., example="t3.micro",
                               description="Cloud resource identifier, e.g. t3.micro / RDS-postgres")

class PredictResponse(BaseModel):
    pr_number: int
    predicted_cost_usd: float
    model_version: str
    message: str

class ForecastRequest(BaseModel):
    daily_costs_usd: list[float] = Field(
        ...,
        min_length=30,
        max_length=30,
        example=[round(50000 + i * 150, 2) for i in range(30)],
        description=(
            "Exactly 30 consecutive daily infrastructure cost values in USD, "
            "ordered oldest-to-newest (index 0 = oldest, index 29 = most recent)."
        ),
    )

class ForecastDay(BaseModel):
    day: int
    predicted_cost_usd: float

class ForecastResponse(BaseModel):
    forecast: list[ForecastDay]
    horizon_days: int
    model_version: str
    message: str

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["root"])
def read_root():
    return {"message": "Welcome to ShadowStack. Use /docs for the interactive API."}


@app.get("/health", status_code=status.HTTP_200_OK, tags=["ops"])
def health_check(db: Session = Depends(get_db)):
    """Verifies the API is live and the PostgreSQL database is reachable."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "model_loaded": ml_model is not None,
            "lstm_loaded": lstm_model is not None,
            "service": "ShadowStack Backend",
            "version": "2.0.0",
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "database": "disconnected",
            "model_loaded": ml_model is not None,
            "lstm_loaded": lstm_model is not None,
            "error": str(e),
        }


# Sprint 2 — PBI: ML Prediction Endpoint
@app.post("/api/predict", response_model=PredictResponse,
          status_code=status.HTTP_200_OK, tags=["ml"])
async def predict_cost(payload: PredictRequest, db: Session = Depends(get_db)):
    """
    Accepts PR metrics and returns a predicted infrastructure cost using the
    trained Random Forest pipeline.  Results are persisted to the `predictions`
    table for tracking and GitHub-comment delivery (Sprint 3).
    """
    if ml_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model unavailable. Ensure MODEL_PATH points to feature_pipeline2.pkl.",
        )

    # Build feature DataFrame — must match training schema in generate_data.py
    input_df = pd.DataFrame([{
        "complexity_score":   payload.complexity_score,
        "resource_units":     payload.resource_units,
        "complexity_x_units": payload.complexity_score * payload.resource_units,
        "service_name":       payload.service_name,
        "resource_type":      payload.resource_type,
    }])

    predicted_cost = round(float(ml_model.predict(input_df)[0]), 2)
    logger.info(f"🔮 PR #{payload.pr_number} prediction: ${predicted_cost:.2f}")

    # Persist to DB — graceful failure keeps the API usable without a DB (dev mode)
    try:
        db.execute(text("""
            INSERT INTO predictions
                (pr_number, complexity_score, resource_units,
                 service_name, resource_type, predicted_cost_usd, model_version)
            VALUES
                (:pr_number, :complexity_score, :resource_units,
                 :service_name, :resource_type, :predicted_cost_usd, :model_version)
        """), {
            "pr_number":          payload.pr_number,
            "complexity_score":   payload.complexity_score,
            "resource_units":     payload.resource_units,
            "service_name":       payload.service_name,
            "resource_type":      payload.resource_type,
            "predicted_cost_usd": predicted_cost,
            "model_version":      MODEL_VERSION,
        })
        db.commit()
        logger.info(f"📝 Prediction saved to DB for PR #{payload.pr_number}")
    except Exception as e:
        logger.warning(f"⚠️  DB write skipped (dev mode — DB offline?): {e}")

    return PredictResponse(
        pr_number=payload.pr_number,
        predicted_cost_usd=predicted_cost,
        model_version=MODEL_VERSION,
        message=f"Estimated infrastructure cost for PR #{payload.pr_number}: ${predicted_cost:.2f}/month",
    )


# Sprint 2 — LSTM 30-Day Cost Forecaster
@app.post("/api/costs/forecast", response_model=ForecastResponse,
          status_code=status.HTTP_200_OK, tags=["ml"])
async def forecast_costs(payload: ForecastRequest):
    """
    Accepts the last 30 days of daily infrastructure costs (USD) and returns a
    30-day ahead forecast using the trained ShadowStackMultiLSTM model.

    The input window is normalised with a MinMaxScaler fitted on the provided
    30 values, which preserves the temporal shape the LSTM learned during
    training while remaining self-contained at inference time.
    """
    if lstm_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LSTM forecaster unavailable. Ensure LSTM_MODEL_PATH points to lstm_final_forecaster.pth.",
        )

    costs = np.array(payload.daily_costs_usd, dtype=np.float32).reshape(-1, 1)

    # Normalise the 30-day input window (same MinMaxScaler logic as training)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(costs)  # shape: (30, 1)

    # Shape expected by the model: (batch=1, seq_len=30, input_size=1)
    x = torch.tensor(scaled, dtype=torch.float32).view(1, 30, 1)

    with torch.no_grad():
        future_scaled = lstm_model(x).cpu().numpy().reshape(-1, 1)  # (30, 1)

    future_costs = scaler.inverse_transform(future_scaled).flatten()

    forecast = [
        ForecastDay(day=i + 1, predicted_cost_usd=round(float(v), 2))
        for i, v in enumerate(future_costs)
    ]

    logger.info(
        f"📈 30-day forecast generated | Day1: ${forecast[0].predicted_cost_usd:.2f} "
        f"| Day30: ${forecast[-1].predicted_cost_usd:.2f}"
    )

    return ForecastResponse(
        forecast=forecast,
        horizon_days=30,
        model_version=LSTM_VERSION,
        message="30-day infrastructure cost forecast generated successfully.",
    )


# PBI-003: GitHub Webhook Listener (Sprint 1 — preserved)
@app.post("/webhook/github", status_code=status.HTTP_202_ACCEPTED, tags=["webhooks"])
async def github_webhook(request: Request):
    """Receives GitHub PR events to trigger code analysis (full wiring in Sprint 3)."""
    try:
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event", "unknown")
        action = payload.get("action", "none")
        logger.info(f"GitHub event: {event_type} | action: {action}")
        return {"message": "Webhook received", "event": event_type, "action": action}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")