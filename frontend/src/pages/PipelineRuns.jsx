// PipelineRuns.jsx — History table of all pipeline runs across all pipelines
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function duration(run) {
  if (!run.started_at || !run.finished_at) return '—';
  const secs = Math.round(
    (new Date(run.finished_at) - new Date(run.started_at)) / 1000
  );
  return `${secs}s`;
}

export default function PipelineRuns() {
  const [runs, setRuns] = useState([]);
  const [pipelines, setPipelines] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/api/runs'),
        api.get('/api/pipelines'),
      ]);
      setRuns(rRes.data);
      // Build id → pipeline map for quick lookup
      const map = {};
      pRes.data.forEach((p) => { map[p.id] = p; });
      setPipelines(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      <h1 className="page-title">Pipeline Runs</h1>
      <p className="page-subtitle">Full history of every pipeline execution.</p>

      <div className="card">
        <div className="card-header">
          <p className="section-title" style={{ marginBottom: 0 }}>
            All Runs {runs.length > 0 && <span className="mono-value" style={{ fontSize: '0.7rem' }}>{runs.length}</span>}
          </p>
          {runs.some(r => r.status === 'running') && (
            <div className="flex-row">
              <div className="spinner" style={{ width: 12, height: 12 }} />
              <span className="text-sm" style={{ color: 'var(--running)' }}>Active runs in progress</span>
            </div>
          )}
        </div>

        {loading && <div className="loading"><div className="spinner"/>Loading runs...</div>}

        {!loading && runs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <p>No runs yet. <a href="/">Trigger a pipeline</a> from the Dashboard.</p>
          </div>
        )}

        {!loading && runs.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Pipeline</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td><span className="mono-value">#{run.id}</span></td>
                    <td className="pipeline-name">{pipelines[run.pipeline_id]?.name || `Pipeline ${run.pipeline_id}`}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td className="text-sm">{formatDate(run.started_at)}</td>
                    <td>
                      {duration(run) !== '—'
                        ? <span className="text-mono text-sm">{duration(run)}</span>
                        : <span className="text-muted text-sm">—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/runs/${run.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
