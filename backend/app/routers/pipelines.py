# routers/pipelines.py — CRUD endpoints for Projects and Pipelines
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Pipeline, Stage
from ..schemas import (
    ProjectCreate, ProjectOut,
    PipelineCreate, PipelineOut,
    StageOut,
)

router = APIRouter()


# ─── Projects ─────────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    if db.query(Project).filter(Project.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Project name already exists")
    project = Project(name=payload.name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    """Return all projects with their pipelines."""
    return db.query(Project).all()


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ─── Pipelines ────────────────────────────────────────────────────────────────

@router.post("/pipelines", response_model=PipelineOut, status_code=201)
def create_pipeline(payload: PipelineCreate, db: Session = Depends(get_db)):
    """
    Create a pipeline and its stages in a single request.
    Expects: { name, project_id, stages: [{name, order_index}] }
    """
    # Verify the project exists
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pipeline = Pipeline(name=payload.name, project_id=payload.project_id)
    db.add(pipeline)
    db.flush()  # Get the pipeline.id before committing

    for stage_data in payload.stages:
        stage = Stage(
            pipeline_id=pipeline.id,
            name=stage_data.name,
            order_index=stage_data.order_index,
        )
        db.add(stage)

    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.get("/pipelines", response_model=List[PipelineOut])
def list_pipelines(db: Session = Depends(get_db)):
    """Return all pipelines with their stages."""
    return db.query(Pipeline).all()


@router.get("/pipelines/{pipeline_id}", response_model=PipelineOut)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


# ─── Stages ───────────────────────────────────────────────────────────────────

@router.get("/stages", response_model=List[StageOut])
def list_stages(db: Session = Depends(get_db)):
    """Return every stage across all pipelines."""
    return db.query(Stage).all()
