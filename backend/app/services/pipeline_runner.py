# pipeline_runner.py — Simulates CI/CD stage execution with realistic delays
import time
import random
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import PipelineRun, StageRun, Stage


# Simulated duration range per stage (seconds)
STAGE_DURATION_MIN = 1
STAGE_DURATION_MAX = 4

# Probability that any single stage will fail (0.0 – 1.0)
FAILURE_PROBABILITY = 0.25


def _simulate_stage(stage_name: str) -> tuple[str, float]:
    """
    Simulate executing a single CI stage.
    Returns (status, duration_seconds).
    Duration is randomised to mimic real workloads.
    """
    duration = round(random.uniform(STAGE_DURATION_MIN, STAGE_DURATION_MAX), 2)
    time.sleep(duration)  # Blocking sleep — runs in a background thread

    # Random failure injection so the dashboard shows realistic mixed results
    failed = random.random() < FAILURE_PROBABILITY
    status = "failed" if failed else "success"
    return status, duration


def execute_pipeline(run_id: int, db: Session) -> None:
    """
    Execute all stages of a pipeline run sequentially.
    Called from a background thread so it does not block the HTTP response.

    Stage logic:
    - Stages run in order_index order.
    - If a stage fails, all subsequent stages are marked 'skipped'.
    - The overall run status reflects the worst outcome.
    """
    # Fetch the run and its related pipeline/stages
    run: PipelineRun = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        return

    stages: list[Stage] = (
        db.query(Stage)
        .filter(Stage.pipeline_id == run.pipeline_id)
        .order_by(Stage.order_index)
        .all()
    )

    # Mark run as active
    run.status = "running"
    db.commit()

    pipeline_failed = False

    for stage in stages:
        stage_run = StageRun(
            run_id=run_id,
            stage_name=stage.name,
            status="running",
        )
        db.add(stage_run)
        db.commit()
        db.refresh(stage_run)

        if pipeline_failed:
            # Previous stage failed — skip remaining stages
            stage_run.status = "skipped"
            stage_run.duration = 0.0
        else:
            status, duration = _simulate_stage(stage.name)
            stage_run.status = status
            stage_run.duration = duration
            if status == "failed":
                pipeline_failed = True

        db.commit()

    # Finalise the overall run status
    run.status = "failed" if pipeline_failed else "success"
    run.finished_at = datetime.utcnow()
    db.commit()
