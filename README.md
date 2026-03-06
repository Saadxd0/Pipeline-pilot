# PipelinePilot — CI/CD Pipeline Management Dashboard

A production-style DevOps platform that simulates CI/CD pipelines and deployment stages.
Built with React, FastAPI, MySQL, Docker, Kubernetes, and GitHub Actions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP :3000
┌────────────────────────▼────────────────────────────────┐
│            Frontend  (React + Vite + Nginx)             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP :8000  /api/*
┌────────────────────────▼────────────────────────────────┐
│              Backend  (Python FastAPI)                  │
└────────────────────────┬────────────────────────────────┘
                         │ TCP :3306
┌────────────────────────▼────────────────────────────────┐
│               Database  (MySQL 8.0)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start — Docker Compose

### Prerequisites
- Docker Desktop (or Docker Engine + Compose v2)

### Run

```bash
git clone https://github.com/youruser/pipelinepilot.git
cd pipelinepilot

docker compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| API      | http://localhost:8000/docs |
| MySQL    | localhost:3306             |

To stop: `docker compose down`
To wipe DB volume too: `docker compose down -v`

---

## Project Structure

```
pipelinepilot/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + startup
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   ├── models.py          # ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── pipelines.py   # CRUD endpoints
│   │   │   └── runs.py        # Run trigger & history
│   │   └── services/
│   │       └── pipeline_runner.py  # Stage simulation
│   ├── tests/
│   │   └── test_pipelines.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreatePipeline.jsx
│   │   │   ├── PipelineRuns.jsx
│   │   │   └── PipelineDetails.jsx
│   │   ├── components/
│   │   │   └── PipelineTable.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   ├── nginx.conf
│   ├── vite.config.js
│   └── Dockerfile
│
├── database/
│   └── init.sql               # Schema + seed data
│
├── kubernetes/
│   ├── mysql-deployment.yaml
│   ├── mysql-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── ingress.yaml
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
└── docker-compose.yml
```

---

## API Reference

### Projects
| Method | Endpoint               | Description            |
|--------|------------------------|------------------------|
| POST   | /api/projects          | Create a new project   |
| GET    | /api/projects          | List all projects      |
| GET    | /api/projects/{id}     | Get a single project   |

### Pipelines
| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| POST   | /api/pipelines              | Create pipeline (with stages)   |
| GET    | /api/pipelines              | List all pipelines              |
| GET    | /api/pipelines/{id}         | Get pipeline details            |

### Runs
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/pipelines/{id}/run     | Trigger a pipeline run   |
| GET    | /api/runs                   | List all runs            |
| GET    | /api/runs/{id}              | Get run with stage results |

### Misc
| Method | Endpoint    | Description           |
|--------|-------------|-----------------------|
| GET    | /api/stages | List all stages       |
| GET    | /health     | Health check (k8s)    |

Interactive Swagger docs: http://localhost:8000/docs

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Set the DB connection string (or use a .env file)
export DATABASE_URL=mysql+pymysql://pilot:pilotpass@localhost:3306/pipelinepilot

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:3000
```

### Running Tests

```bash
cd backend
pytest tests/ -v
# Tests use SQLite — no MySQL required
```

---

## Kubernetes Deployment

### Prerequisites
- A Kubernetes cluster (Minikube, kind, GKE, EKS, AKS…)
- `kubectl` configured to point at your cluster
- Images pushed to Docker Hub (see CI/CD section)

### Steps

```bash
# 1. Update image names in manifests (replace 'yourdockerhubuser')
sed -i 's/yourdockerhubuser/YOURUSERNAME/g' kubernetes/*.yaml

# 2. Apply all manifests
kubectl apply -f kubernetes/

# 3. Watch rollout
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend

# 4. Get service URLs
kubectl get services
```

### Local Minikube

```bash
minikube start
minikube addons enable ingress

kubectl apply -f kubernetes/

# Add to /etc/hosts:
# 127.0.0.1 pipelinepilot.local
echo "$(minikube ip) pipelinepilot.local" | sudo tee -a /etc/hosts

# Open in browser
open http://pipelinepilot.local
```

---

## CI/CD — GitHub Actions

The workflow at `.github/workflows/ci-cd.yml` runs on every push to `main`:

1. **Test** — Runs Pytest with SQLite (no DB required)
2. **Build** — Builds Docker images with layer caching
3. **Push** — Pushes images to Docker Hub tagged with `latest` + git SHA
4. **Deploy** — Applies Kubernetes manifests and waits for rollout

### Required GitHub Secrets

| Secret              | Value                            |
|---------------------|----------------------------------|
| `DOCKERHUB_USERNAME`| Your Docker Hub username         |
| `DOCKERHUB_TOKEN`   | Docker Hub access token          |
| `KUBE_CONFIG`       | `cat ~/.kube/config \| base64`   |

Set these in: **GitHub repo → Settings → Secrets and variables → Actions**

---

## Environment Variables

### Backend
| Variable        | Default                                                      | Description              |
|-----------------|--------------------------------------------------------------|--------------------------|
| `DATABASE_URL`  | `mysql+pymysql://pilot:pilotpass@localhost:3306/pipelinepilot` | MySQL connection string |
| `ALLOWED_ORIGINS` | `http://localhost:3000`                                    | CORS allowed origins     |

### Frontend
| Variable       | Default | Description                   |
|----------------|---------|-------------------------------|
| `VITE_API_URL` | ` `     | API base URL (empty = use Vite proxy) |

---

## Pipeline Stage Simulation

When a pipeline is triggered, the backend simulates stage execution in a background thread:

- Each stage runs sequentially in `order_index` order
- Duration is randomised (1–4 seconds per stage)
- There is a 25% chance any stage fails
- If a stage fails, all subsequent stages are marked **Skipped**
- The overall run status reflects the worst outcome

Example outcome:

```
Build         → success  (2.3s)
Test          → success  (3.1s)
Security Scan → failed   (1.8s)
Deploy        → skipped  (0.0s)
```

The dashboard polls the API every 5 seconds to show live updates.

---

## Technology Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Frontend   | React 18, Vite, React Router |
| HTTP Client| Axios                        |
| Styling    | Custom CSS (dark theme)      |
| Backend    | Python 3.12, FastAPI         |
| ORM        | SQLAlchemy 2.0               |
| Validation | Pydantic v2                  |
| Database   | MySQL 8.0                    |
| Container  | Docker, Docker Compose       |
| Orchestration | Kubernetes                |
| CI/CD      | GitHub Actions               |
| Web Server | Nginx (frontend)             |
| ASGI Server| Uvicorn (backend)            |
