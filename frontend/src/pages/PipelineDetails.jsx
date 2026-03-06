// PipelineDetails.jsx — Detailed view of a single pipeline run with stage breakdown
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const STATUS_ICON = {
  success: '✓',
  failed: '✗',
  running: '◎',
  skipped: '◌',
  pending: '○',
};

function StageChip({ stage }) {
  return (
    <div className={`stage-chip ${stage.status}`}>
      <span className="stage-chip-icon">{STATUS_ICON[stage.status] || '?'}</span>
      <span>{stage.stage_name}</span>
      {stage.duration != null && (
        <span className="stage-dur">{stage.duration}s</span>
      )}
    </div>
  );
}

function TimelineDot({ status }) {
  return (
    <div className={`timeline-dot ${status}`}>
      {STATUS_ICON[status] || '?'}
    </div>
  );
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export default function PipelineDetails() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRun = useCallback(async () => {
    try {
      const res = await api.get(`/api/runs/${runId}`);
      setRun(res.data);
      // Also fetch the pipeline so we can show its name
      const pRes = await api.get(`/api/pipelines/${res.data.pipeline_id}`);
      setPipeline(pRes.data);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun();
    // Keep polling while the run is still active
    const interval = setInterval(() => {
      if (run?.status === 'running' || run?.status === 'pending') {
        fetchRun();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchRun, run?.status]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading run details...</div>;
  if (!run) return <div className="error-banner">Run not found.</div>;

  const totalDuration = run.stage_runs.reduce(
    (acc, s) => acc + (s.duration || 0), 0
  ).toFixed(1);

  const successCount = run.stage_runs.filter(s => s.status === 'success').length;
  const progressPct = run.stage_runs.length
    ? Math.round((successCount / run.stage_runs.length) * 100)
    : 0;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* Run header */}
      <div className="run-header mt-24">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>
            Run <span className="mono-value">#{run.id}</span>
          </h1>
          <div className="run-meta">
            <span className="run-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <strong>{pipeline?.name || `Pipeline ${run.pipeline_id}`}</strong>
            </span>
            <span className="run-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Started: <strong>{formatDate(run.started_at)}</strong>
            </span>
            {run.finished_at && (
              <span className="run-meta-item">
                Finished: <strong>{formatDate(run.finished_at)}</strong>
              </span>
            )}
          </div>
        </div>
        <span className={`badge badge-${run.status}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          {run.status}
        </span>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {run.stage_runs.length}
          </div>
          <div className="stat-label">Total Stages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{successCount}</div>
          <div className="stat-label">Passed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--failed)' }}>
            {run.stage_runs.filter(s => s.status === 'failed').length}
          </div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {totalDuration}s
          </div>
          <div className="stat-label">Duration</div>
        </div>
      </div>

      {/* Progress bar */}
      {run.status === 'running' && (
        <div className="card" style={{ padding: '16px 24px' }}>
          <div className="flex-between mb-8">
            <span className="text-soft text-sm">Pipeline progress</span>
            <span className="text-sm text-mono">{progressPct}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Stage flow visual */}
      <div className="card">
        <p className="section-title">Execution Flow</p>
        {run.stage_runs.length === 0 ? (
          <div className="loading"><div className="spinner"/>Waiting for stages...</div>
        ) : (
          <div className="stage-flow">
            {run.stage_runs.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                {idx > 0 && <span className="stage-arrow">›</span>}
                <StageChip stage={stage} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {run.stage_runs.length > 0 && (
        <div className="card">
          <p className="section-title">Stage Timeline</p>
          <div className="timeline">
            {run.stage_runs.map((stage, idx) => (
              <div className="timeline-item" key={stage.id}>
                {idx < run.stage_runs.length - 1 && <div className="timeline-line" />}
                <TimelineDot status={stage.status} />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-stage-name">{stage.stage_name}</span>
                    <span className={`badge badge-${stage.status}`}>{stage.status}</span>
                  </div>
                  <div className="timeline-meta">
                    {stage.duration != null
                      ? `Completed in ${stage.duration}s`
                      : stage.status === 'running'
                        ? 'In progress...'
                        : stage.status === 'skipped'
                          ? 'Skipped — previous stage failed'
                          : 'Waiting...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
