# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Multi-stage build: keeps the final image lean by separating build and runtime.

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /install

# Copy only requirements first to leverage Docker layer caching.
# If requirements.txt hasn't changed, this layer is reused.
COPY requirements.txt .

# Install dependencies into a local prefix so we can copy them cleanly
RUN pip install --prefix=/install/packages --no-cache-dir -r requirements.txt


# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages from the builder stage
COPY --from=builder /install/packages /usr/local

# Copy application source code
COPY app/ ./app/

# Expose the FastAPI port
EXPOSE 8000

# Run the app with Uvicorn (production-grade ASGI server)
# --host 0.0.0.0 makes it reachable from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
