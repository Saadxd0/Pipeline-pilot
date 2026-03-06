# schemas.py — Pydantic models for request/response validation
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# ─── Stage Schemas ────────────────────────────────────────────────────────────

class StageBase(BaseModel):
    name: str
    order_index: int = 0


class StageCreate(StageBase):
    pass


class StageOut(StageBase):
    id: int
    pipeline_id: int

    class Config:
        from_attributes = True  # Enable ORM mode


# ─── Pipeline Schemas ─────────────────────────────────────────────────────────

class PipelineBase(BaseModel):
    name: str
    project_id: int


class PipelineCreate(PipelineBase):
    stages: List[StageCreate] = []  # Stages to create alongside the pipeline


class PipelineOut(PipelineBase):
    id: int
    stages: List[StageOut] = []

    class Config:
        from_attributes = True


# ─── Project Schemas ──────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    pipelines: List[PipelineOut] = []

    class Config:
        from_attributes = True


# ─── StageRun Schemas ─────────────────────────────────────────────────────────

class StageRunOut(BaseModel):
    id: int
    run_id: int
    stage_name: str
    status: str
    duration: Optional[float] = None

    class Config:
        from_attributes = True


# ─── PipelineRun Schemas ──────────────────────────────────────────────────────

class PipelineRunOut(BaseModel):
    id: int
    pipeline_id: int
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    stage_runs: List[StageRunOut] = []

    class Config:
        from_attributes = True
