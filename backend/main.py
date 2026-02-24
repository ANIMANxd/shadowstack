from fastapi import FastAPI, Request, status, Depends
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os
import logging

# Configure logging to see events in Docker logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ShadowStack API",
    description="Predictive Cloud Cost Optimizer - Sprint 1",
    version="1.0.0"
)

# PBI-002: Database Configuration 
# Uses the environment variable defined in your docker-compose.yml
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://shadow_user:shadow_pass@db:5432/shadowstack_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# PBI-002: Health Check Endpoint 
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """
    Verifies the API is live and the PostgreSQL database is reachable.
    """
    try:
        # Execute a simple query to test connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "service": "ShadowStack Backend",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# PBI-003: GitHub Webhook Listener 
@app.post("/webhook/github", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(request: Request):
    """
    Receives and validates GitHub PR events to trigger code analysis.
    """
    try:
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event", "unknown")
        action = payload.get("action", "none")
        
        logger.info(f"Received GitHub event: {event_type} | Action: {action}")
        
        # PBI-003 requires logging the payload to the DB in future sprints, 
        # but for now, we return a success response to GitHub 
        return {
            "message": "Webhook received",
            "event": event_type,
            "action": action
        }
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"error": "Invalid payload"}, status.HTTP_400_BAD_REQUEST

@app.get("/")
def read_root():
    return {"message": "Welcome to ShadowStack. Use /docs for API documentation."}