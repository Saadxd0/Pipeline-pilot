# test_pipelines.py — Integration tests using an in-memory SQLite DB
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# Use SQLite for tests (no MySQL required)
SQLITE_URL = "sqlite:///./test.db"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override DB dependency so tests use SQLite
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


# ─── Project Tests ────────────────────────────────────────────────────────────

def test_create_project():
    response = client.post("/api/projects", json={"name": "my-app"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "my-app"
    assert "id" in data


def test_list_projects_empty():
    response = client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []


def test_duplicate_project_returns_409():
    client.post("/api/projects", json={"name": "duplicate"})
    response = client.post("/api/projects", json={"name": "duplicate"})
    assert response.status_code == 409


# ─── Pipeline Tests ───────────────────────────────────────────────────────────

def _create_project(name="test-project"):
    r = client.post("/api/projects", json={"name": name})
    return r.json()["id"]


def test_create_pipeline_with_stages():
    project_id = _create_project()
    payload = {
        "name": "main-pipeline",
        "project_id": project_id,
        "stages": [
            {"name": "Build", "order_index": 0},
            {"name": "Test", "order_index": 1},
            {"name": "Deploy", "order_index": 2},
        ],
    }
    response = client.post("/api/pipelines", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "main-pipeline"
    assert len(data["stages"]) == 3


def test_pipeline_missing_project_returns_404():
    payload = {"name": "orphan", "project_id": 9999, "stages": []}
    response = client.post("/api/pipelines", json=payload)
    assert response.status_code == 404


def test_get_pipeline():
    project_id = _create_project()
    create_r = client.post("/api/pipelines", json={
        "name": "ci", "project_id": project_id, "stages": []
    })
    pid = create_r.json()["id"]
    response = client.get(f"/api/pipelines/{pid}")
    assert response.status_code == 200
    assert response.json()["id"] == pid


# ─── Health Check ─────────────────────────────────────────────────────────────

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
