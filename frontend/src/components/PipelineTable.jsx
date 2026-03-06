// PipelineTable.jsx — Reusable table that shows pipelines with last run status
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status || 'pending'}`}>{status || 'no runs'}</span>;
}

export default function PipelineTable({ pipelines, runs, onTrigger }) {
  const navigate = useNavigate();

  // Build a map: pipeline_id → latest run
  const latestRun = React.useMemo(() => {
    const map = {};
    runs.forEach((run) => {
      if (!map[run.pipeline_id] || run.id > map[run.pipeline_id].id) {
        map[run.pipeline_id] = run;
      }
    });
    return map;
  }, [runs]);

  const handleTrigger = async (pipelineId) => {
    try {
      await api.post(`/api/pipelines/${pipelineId}/run`);
      if (onTrigger) onTrigger();
    } catch (err) {
      console.error('Failed to trigger run:', err);
    }
  };

  if (!pipelines.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <p>No pipelines yet. <a href="/create">Create your first one</a>.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pipeline</th>
            <th>Stages</th>
            <th>Status</th>
            <th>Last Run</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map((pipeline) => {
            const run = latestRun[pipeline.id];
            const isRunning = run?.status === 'running';
            return (
              <tr key={pipeline.id}>
                <td>
                  <span className="pipeline-name">{pipeline.name}</span>
                  <br />
                  <span className="text-muted text-sm">Project #{pipeline.project_id}</span>
                </td>
                <td>
                  <div className="pipeline-stages-preview">
                    {pipeline.stages.map((s, i) => (
                      <React.Fragment key={s.id}>
                        {i > 0 && <span className="stage-sep">›</span>}
                        <span className="stage-dot">{s.name}</span>
                      </React.Fragment>
                    ))}
                    {pipeline.stages.length === 0 && <span className="text-muted text-sm">No stages</span>}
                  </div>
                </td>
                <td><StatusBadge status={run?.status} /></td>
                <td>
                  {run ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/runs/${run.id}`)}
                    >
                      Run #{run.id}
                    </button>
                  ) : <span className="text-muted text-sm">Never</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={`btn btn-sm ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleTrigger(pipeline.id)}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <><div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Running</>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Trigger
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
