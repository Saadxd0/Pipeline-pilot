-- init.sql — Initial MySQL schema for PipelinePilot
-- This file is automatically executed when the MySQL container starts for the first time.
-- SQLAlchemy will also create tables via Base.metadata.create_all(), but this file
-- ensures the schema exists even if the backend hasn't started yet.

CREATE DATABASE IF NOT EXISTS pipelinepilot
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pipelinepilot;

-- ─── projects ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── pipelines ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT         NOT NULL,
  name       VARCHAR(100) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ─── stages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT          NOT NULL,
  name        VARCHAR(100) NOT NULL,
  order_index INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
);

-- ─── pipeline_runs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT         NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME    NULL,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
);

-- ─── stage_runs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stage_runs (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  run_id     INT          NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  duration   FLOAT        NULL,           -- seconds taken for this stage
  FOREIGN KEY (run_id) REFERENCES pipeline_runs(id) ON DELETE CASCADE
);

-- ─── Seed data (demo pipelines) ────────────────────────────────────────────
INSERT IGNORE INTO projects (name) VALUES ('demo-app'), ('api-service');

INSERT IGNORE INTO pipelines (project_id, name)
  VALUES (1, 'main-ci'), (2, 'api-deploy');

INSERT IGNORE INTO stages (pipeline_id, name, order_index) VALUES
  (1, 'Build',         0),
  (1, 'Test',          1),
  (1, 'Security Scan', 2),
  (1, 'Deploy',        3),
  (2, 'Build',         0),
  (2, 'Test',          1),
  (2, 'Deploy',        2);
