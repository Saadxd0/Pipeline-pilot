# routers/runs.py — Endpoints to trigger and inspect pipeline runs
import threading
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db, SessionLocal
from ..models import Pipeline, PipelineRun
from ..schemas import PipelineRunOut
from ..services.pipeline_runner import execute_pipeline

router = APIRouter()


def _run_in_background(run_id: int) -> None:
    """
    Spin up a new DB session and execute the pipeline in a background thread.
    A fresh session is required because the thread-local session from the
    request context will be closed by the time the thread runs.
    """
    db = SessionLocal()
    try:
        execute_pipeline(run_id, db)
    finally:
        db.close()


@router.post("/pipelines/{pipeline_id}/run", response_model=PipelineRunOut, status_code=202)
def trigger_run(pipeline_id: int, db: Session = Depends(get_db)):
    """
    Trigger a new run for the given pipeline.
    Returns immediately with status='pending'; execution happens in background.
    """
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Create the run record
    run = PipelineRun(pipeline_id=pipeline_id, status="pending")
    db.add(run)
    db.commit()
    db.refresh(run)

    # Execute stages asynchronously so the HTTP response is not blocked
    thread = threading.Thread(target=_run_in_background, args=(run.id,), daemon=True)
    thread.start()

    return run


@router.get("/runs", response_model=List[PipelineRunOut])
def list_runs(db: Session = Depends(get_db)):
    """Return all pipeline runs, newest first."""
    return (
        db.query(PipelineRun)
        .order_by(PipelineRun.started_at.desc())
        .all()
    )


@router.get("/runs/{run_id}", response_model=PipelineRunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    """Return a single run with all its stage results."""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
