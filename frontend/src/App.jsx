// App.jsx — Root component with routing and sidebar layout
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreatePipeline from './pages/CreatePipeline';
import PipelineRuns from './pages/PipelineRuns';
import PipelineDetails from './pages/PipelineDetails';

const IconGrid = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconPlus = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const IconActivity = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div className="sidebar-logo-text">Pipeline<span>Pilot</span></div>
      </div>

      <div className="sidebar-section">Navigation</div>

      <nav>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <IconGrid /> Dashboard
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => isActive ? 'active' : ''}>
          <IconPlus /> Create Pipeline
        </NavLink>
        <NavLink to="/runs" className={({ isActive }) => isActive ? 'active' : ''}>
          <IconActivity /> Pipeline Runs
        </NavLink>
      </nav>

      <div className="sidebar-footer">v1.0.0 &nbsp;&middot;&nbsp; DevOps Platform</div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreatePipeline />} />
            <Route path="/runs" element={<PipelineRuns />} />
            <Route path="/runs/:runId" element={<PipelineDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
