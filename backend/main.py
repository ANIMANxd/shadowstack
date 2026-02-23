from fastapi import FastAPI
from sqlalchemy import create_engine
import os

app = FastAPI(title="ShadowStack API", version="1.0")

# Fetch the DB URL from Docker environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/shadowstack_db")
engine = create_engine(DATABASE_URL)

@app.get("/health")
def health_check():
    # PBI-002 Requirement: /health returns 200 and checks DB connection
    try:
        with engine.connect() as connection:
            db_status = "connected"
    except Exception as e:
        db_status = f"disconnected ({str(e)})"
        
    return {
        "status": "healthy",
        "database": db_status,
        "service": "ShadowStack Backend"
    }