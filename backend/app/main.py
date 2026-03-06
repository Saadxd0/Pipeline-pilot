# main.py — FastAPI application entry point
import os
import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from .database import engine, Base
from .routers import pipelines, runs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PipelinePilot API",
    description="CI/CD Pipeline Management Dashboard — Backend API",
    version="1.0.0",
)

# Allow the React dev server (port 3000) and any Docker network origin
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── DB Initialisation ────────────────────────────────────────────────────────

def wait_for_db(retries: int = 10, delay: int = 3) -> None:
    """
    Retry loop to wait for MySQL to become available.
    Useful in Docker Compose where the app container may start before MySQL.
    """
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection established.")
            return
        except OperationalError as exc:
            logger.warning(f"DB not ready (attempt {attempt}/{retries}): {exc}")
            time.sleep(delay)
    raise RuntimeError("Could not connect to the database after multiple retries.")


@app.on_event("startup")
def startup_event():
    """Create all tables on startup (idempotent — safe to run every boot)."""
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified.")


# ─── Routers ──────────────────────────────────────────────────────────────────

# Mount all routes under /api for clean separation from future static assets
app.include_router(pipelines.router, prefix="/api", tags=["Pipelines & Projects"])
app.include_router(runs.router, prefix="/api", tags=["Pipeline Runs"])


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    """Kubernetes liveness / readiness probe endpoint."""
    return {"status": "ok", "service": "pipelinepilot-api"}
