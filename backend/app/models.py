# models.py — SQLAlchemy ORM models (maps Python classes → DB tables)
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base


class Project(Base):
    """A top-level grouping for related pipelines (e.g., 'my-app')."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One project → many pipelines
    pipelines = relationship("Pipeline", back_populates="project", cascade="all, delete")


class Pipeline(Base):
    """A CI/CD pipeline belonging to a project."""
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)

    project = relationship("Project", back_populates="pipelines")
    stages = relationship("Stage", back_populates="pipeline", cascade="all, delete", order_by="Stage.order_index")
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete")


class Stage(Base):
    """A single step inside a pipeline (e.g., Build, Test, Deploy)."""
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    name = Column(String(100), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)  # Execution order

    pipeline = relationship("Pipeline", back_populates="stages")


class PipelineRun(Base):
    """One execution of a pipeline (triggered manually or by CI)."""
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    # Possible values: pending | running | success | failed
    status = Column(String(20), nullable=False, default="pending")
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    pipeline = relationship("Pipeline", back_populates="runs")
    stage_runs = relationship("StageRun", back_populates="run", cascade="all, delete")


class StageRun(Base):
    """The result of executing a single stage within a pipeline run."""
    __tablename__ = "stage_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("pipeline_runs.id"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    # Possible values: pending | running | success | failed | skipped
    status = Column(String(20), nullable=False, default="pending")
    duration = Column(Float, nullable=True)  # Seconds taken for this stage

    run = relationship("PipelineRun", back_populates="stage_runs")
