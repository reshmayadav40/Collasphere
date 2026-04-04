import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error) {
      setError('Failed to load projects. Is the server running?');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc,
        visibility,
      });
      setProjects([res.data, ...projects]);
      setShowCreate(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setVisibility('private');
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
        <span>Loading your workspace...</span>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            👋 Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Manage and collaborate on your projects</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`btn ${showCreate ? 'btn-ghost' : 'btn-primary'}`}
        >
          {showCreate ? '✕ Cancel' : '+ New Project'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.filter(p => p.owner?._id === user?._id || p.owner === user?._id).length}
          </div>
          <div className="stat-label">Owned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {projects.reduce((acc, p) => acc + (p.members?.length || 1), 0)}
          </div>
          <div className="stat-label">Collaborators</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">AI</div>
          <div className="stat-label">Gemini Powered</div>
        </div>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="card card-no-hover" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            🆕 Create New Project
          </h2>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. My Portfolio Website"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="What is this project about?"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select 
                className="form-input"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="private">🔒 Private (Only members can see)</option>
                <option value="public">🌐 Public (Anyone with link can view)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? '⟳ Creating...' : '✓ Create Project'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROJECTS GRID */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <h3>No projects yet</h3>
          <p>Create your first project and start collaborating with your team.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
          <div className="projects-grid">
            {projects.map((project) => {
              const isOwner =
                project.owner?._id === user?._id ||
                project.owner === user?._id;
              return (
                <Link
                  key={project._id}
                  to={`/project/${project._id}`}
                  className="project-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>{project.name}</h3>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {project.visibility === 'public' && <span className="badge badge-success" style={{ padding: '0.1rem 0.4rem', fontSize: '0.6rem' }}>🌐 Public</span>}
                      <span className={`badge ${isOwner ? 'badge-owner' : 'badge-member'}`}>
                        {isOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>
                  <p>{project.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span className="meta-tag">👥 {project.members?.length || 1} member{project.members?.length !== 1 ? 's' : ''}</span>
                    <span className="meta-tag">📅 {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
