// Dashboard.jsx — Overview of all pipelines and summary stats
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PipelineTable from '../components/PipelineTable';

export default function Dashboard() {
  const [pipelines, setPipelines] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/api/pipelines'),
        api.get('/api/runs'),
      ]);
      setPipelines(pRes.data);
      setRuns(rRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds to show live status updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Summary counts
  const total = runs.length;
  const success = runs.filter((r) => r.status === 'success').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const running = runs.filter((r) => r.status === 'running').length;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of all pipelines and recent run activity.</p>

      {/* Stat summary row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div className="stat-value">{pipelines.length}</div>
          <div className="stat-label">Pipelines</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Runs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{success}</div>
          <div className="stat-label">Successful</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--failed)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--failed)' }}>{failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--running)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--running)' }}>{running}</div>
          <div className="stat-label">Running</div>
        </div>
      </div>

      {/* Pipelines table */}
      <div className="card">
        <div className="card-header">
          <p className="section-title" style={{ marginBottom: 0 }}>All Pipelines</p>
          <a href="/create" className="btn btn-primary btn-sm">+ New Pipeline</a>
        </div>
        {loading && <div className="loading"><div className="spinner"/>Loading pipelines...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && (
          <PipelineTable
            pipelines={pipelines}
            runs={runs}
            onTrigger={fetchData}
          />
        )}
      </div>
    </div>
  );
}
