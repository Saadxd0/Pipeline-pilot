// CreatePipeline.jsx — Form to create a project, pipeline, and its stages
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DEFAULT_STAGES = [
  { name: 'Build', order_index: 0 },
  { name: 'Test', order_index: 1 },
  { name: 'Security Scan', order_index: 2 },
  { name: 'Deploy', order_index: 3 },
];

export default function CreatePipeline() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectMode, setProjectMode] = useState('new'); // 'new' | 'existing'
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/projects').then((r) => setProjects(r.data));
  }, []);

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      { name: '', order_index: prev.length },
    ]);
  };

  const removeStage = (idx) => {
    setStages((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order_index: i }))
    );
  };

  const updateStage = (idx, value) => {
    setStages((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, name: value } : s))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let projectId = selectedProjectId;

      // If creating a new project, do that first
      if (projectMode === 'new') {
        const pRes = await api.post('/api/projects', { name: newProjectName });
        projectId = pRes.data.id;
      }

      // Then create the pipeline with its stages
      const payload = {
        name: pipelineName,
        project_id: Number(projectId),
        stages: stages.filter((s) => s.name.trim() !== ''),
      };
      await api.post('/api/pipelines', payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Create Pipeline</h1>
      <p className="page-subtitle">Define a new pipeline and its execution stages.</p>

      <div className="card" style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>

          {/* Project selection */}
          <div className="form-group">
            <label>Project</label>
            <div className="flex-row mb-8">
              <button
                type="button"
                className={`btn btn-sm ${projectMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setProjectMode('new')}
              >
                New Project
              </button>
              <button
                type="button"
                className={`btn btn-sm ${projectMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setProjectMode('existing')}
              >
                Existing Project
              </button>
            </div>
            {projectMode === 'new' ? (
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., my-web-app"
                required
              />
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="divider" />

          {/* Pipeline name */}
          <div className="form-group">
            <label>Pipeline Name</label>
            <input
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g., main-ci"
              required
            />
          </div>

          <div className="divider" />

          {/* Stages editor */}
          <div className="form-group">
            <label>
              Stages
              <span className="text-muted text-sm" style={{ marginLeft: 8, fontWeight: 400 }}>
                executed sequentially
              </span>
            </label>

            <div className="flex-col" style={{ gap: 6 }}>
              {stages.map((stage, idx) => (
                <div key={idx} className="stage-input-row">
                  <span className="stage-order-num">{String(idx + 1).padStart(2, '0')}</span>
                  <input
                    value={stage.name}
                    onChange={(e) => updateStage(idx, e.target.value)}
                    placeholder="Stage name (e.g., Build)"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeStage(idx)}
                    title="Remove stage"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-secondary btn-sm mt-12" onClick={addStage}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Stage
            </button>
          </div>

          {error && <div className="error-banner mt-12">{error}</div>}

          <div className="divider" />

          <div className="flex-row flex-end">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Creating...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Create Pipeline
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
