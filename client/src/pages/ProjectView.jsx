import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Helper ──────────────────────────────────────────────────────────
function getFileIcon(mimetype = '', name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return '📜';
  if (['py'].includes(ext)) return '🐍';
  if (['html', 'htm'].includes(ext)) return '🌐';
  if (['css', 'scss'].includes(ext)) return '🎨';
  if (['json'].includes(ext)) return '📋';
  if (['md'].includes(ext)) return '📝';
  if (mimetype.startsWith('image')) return '🖼️';
  if (mimetype.startsWith('video')) return '🎬';
  if (mimetype.includes('pdf')) return '📄';
  return '📁';
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────

// NOTES TAB
function NotesTab({ projectId, user }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    api.get(`/notes/project/${projectId}`)
      .then(r => setNotes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/notes', { title, content, project: projectId });
      setNotes([res.data, ...notes]);
      setTitle(''); setContent(''); setShowCreate(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note permanently?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(notes.filter(n => n._id !== noteId));
      if (selectedNote?._id === noteId) setSelectedNote(null);
    } catch (err) { alert('Failed to delete note.'); }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/notes/${selectedNote._id}`, {
        title: selectedNote.title,
        content: selectedNote.content,
      });
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
      setEditMode(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading notes...</span></div>;

  if (selectedNote) {
    return (
      <div>
        <div className="section-header">
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedNote(null); setEditMode(false); }}>
            ← Back to notes
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!editMode ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={saving}>
                  {saving ? '⟳ Saving...' : '✓ Save'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
              </>
            )}
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              onClick={(e) => handleDeleteNote(selectedNote._id, e)}
            >🗑 Delete</button>
          </div>
        </div>
        <div className="card card-no-hover">
          {editMode ? (
            <>
              <input
                className="form-input"
                style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700' }}
                value={selectedNote.title}
                onChange={e => setSelectedNote({ ...selectedNote, title: e.target.value })}
              />
              <textarea
                className="form-input"
                style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.875rem' }}
                value={selectedNote.content}
                onChange={e => setSelectedNote({ ...selectedNote, content: e.target.value })}
              />
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                {selectedNote.title}
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                By {selectedNote.author?.name} · {new Date(selectedNote.updatedAt).toLocaleString()}
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                minHeight: '200px',
              }}>
                {selectedNote.content || 'No content yet.'}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <span className="section-title">📝 Notes ({notes.length})</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ New Note'}
        </button>
      </div>

      {showCreate && (
        <div className="card card-no-hover" style={{ marginBottom: '1.25rem' }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="Note title"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content (Markdown supported)</label>
              <textarea
                className="form-input"
                placeholder="# My Note&#10;Write your markdown content here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⟳ Saving...' : '✓ Save Note'}
            </button>
          </form>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No notes yet</h3>
          <p>Create markdown notes to document your project.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note._id} className="note-card" onClick={() => setSelectedNote(note)} style={{ position: 'relative' }}>
              <h4>{note.title}</h4>
              <p>{note.content || 'No content'}</p>
              <div className="note-footer">
                <span>✍️ {note.author?.name}</span>
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
              <button
                onClick={(e) => handleDeleteNote(note._id, e)}
                style={{
                  position: 'absolute', top: '0.6rem', right: '0.6rem',
                  background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                  padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem'
                }}
              >🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// FILES TAB
function FilesTab({ projectId, onViewFile, files, setFiles, loading, isPending }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdateFile = async (fileId, newFile) => {
    if (!newFile) return;
    const formData = new FormData();
    formData.append('file', newFile);
    setUploading(true);
    try {
      const res = await api.put(`/files/${fileId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles(files.map(f => f._id === fileId ? res.data : f));
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(files.filter(f => f._id !== fileId));
    } catch (err) { alert('Failed to delete file.'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post(`/files/project/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles([res.data, ...files]);
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(false);
  };

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading files...</span></div>;

  return (
    <div>
      <div className="section-header">
        <span className="section-title">📁 Files ({files.length})</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button className="btn btn-secondary btn-sm" onClick={() => window.open(`http://localhost:5000/api/files/download/project/${projectId}`)}>
             📦 Download ZIP
           </button>
           {!isPending && (
             <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
               {uploading ? '⟳ Uploading...' : '⬆ Upload File'}
             </button>
           )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {!isPending && (
        <div
          className="upload-area"
          style={{ marginBottom: '1.5rem' }}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="upload-icon">☁️</div>
          <div className="upload-text">
            <strong style={{ color: 'var(--accent-light)' }}>Click to upload</strong> or drag and drop<br />
            <span style={{ fontSize: '0.75rem' }}>JS, HTML, CSS, Python, JSON, PDF, images — up to 10MB</span>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No files uploaded</h3>
          <p>Upload code files, documents, or images to share with your team.</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map(file => (
            <div key={file._id} className="file-item">
              <div className="file-info">
                <div className="file-icon">{getFileIcon(file.mimetype, file.originalname)}</div>
                <div>
                  <div className="file-name">{file.originalname}</div>
                  <div className="file-meta">
                    {formatBytes(file.size)} · Created: {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                  {file.updatedBy && (
                    <div className="file-meta" style={{ color: 'var(--accent-light)', marginTop: '2px' }}>
                      ✨ Last updated by {file.updatedBy?.name} on {new Date(file.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onViewFile(file)}
                >
                  ↗ View
                </button>
                {!isPending && (
                  <>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-light)', border: '1px solid rgba(139,92,246,0.3)' }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = (e) => handleUpdateFile(file._id, e.target.files[0]);
                        input.click();
                      }}
                      disabled={uploading}
                    >
                      🔄 Update
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                      onClick={() => handleDeleteFile(file._id)}
                    >🗑 Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AI TAB
function AITab({ project, isPending }) {
  const [mode, setMode] = useState('explain');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modes = [
    { key: 'explain', icon: '🔍', title: 'Explain Code', desc: 'Get a plain-English explanation of any code snippet.' },
    { key: 'suggest', icon: '💡', title: 'Suggest Improvements', desc: 'Get AI suggestions to improve your notes or code.' },
    { key: 'docs', icon: '📖', title: 'Generate Docs', desc: 'Auto-generate Markdown documentation for code.' },
    { key: 'readme', icon: '📄', title: 'Generate README', desc: 'Create a professional README for your project.' },
  ];

  const handleRun = async () => {
    if (!input.trim() && mode !== 'readme') return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      let res;
      if (mode === 'explain') {
        res = await api.post('/gemini/explain', { content: input, type: 'code' });
        setOutput(res.data.explanation);
      } else if (mode === 'suggest') {
        res = await api.post('/gemini/suggest', { content: input });
        setOutput(res.data.suggestions);
      } else if (mode === 'docs') {
        res = await api.post('/gemini/docs', { code: input });
        setOutput(res.data.documentation);
      } else if (mode === 'readme') {
        res = await api.post('/gemini/readme', {
          projectName: project?.name,
          description: project?.description,
          features: input || 'Standard features',
        });
        setOutput(res.data.readme);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AI request failed. Check your GEMINI_API_KEY in server/.env');
    }
    setLoading(false);
  };

  const placeholders = {
    explain: 'Paste your code here...\n\nfor(let i=0;i<5;i++){\n  console.log(i);\n}',
    suggest: 'Paste your notes or code to improve...',
    docs: 'Paste the function or module to document...',
    readme: 'List key features of this project (optional)...',
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="section-title" style={{ marginBottom: '0.25rem' }}>🤖 Gemini AI Assistant</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Powered by Google Gemini — explain code, generate docs, and create READMEs
        </div>
      </div>

      <div className="ai-options">
        {modes.map(m => (
          <button
            key={m.key}
            className={`ai-option-btn ${mode === m.key ? 'active' : ''}`}
            onClick={() => { setMode(m.key); setOutput(''); setError(''); }}
          >
            <div className="ai-option-icon">{m.icon}</div>
            <div className="ai-option-title">{m.title}</div>
            <div className="ai-option-desc">{m.desc}</div>
          </button>
        ))}
      </div>

      <div className="card card-no-hover">
        <div className="form-group">
          <label className="form-label">
            {mode === 'readme' ? 'Extra Features (optional)' : 'Input'}
          </label>
          <textarea
            className="form-input"
            placeholder={placeholders[mode]}
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={6}
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={loading || isPending}
          style={{ marginBottom: error || output ? '1.25rem' : 0 }}
        >
          {loading ? (
            <>
              <div className="dot-anim">
                <span /><span /><span />
              </div>
              Generating...
            </>
          ) : (
            `✨ Run ${modes.find(m2 => m2.key === mode)?.title}`
          )}
        </button>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading && (
          <div className="ai-output loading">
            <div className="dot-anim"><span /><span /><span /></div>
            Gemini is thinking...
          </div>
        )}

        {output && !loading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✨ AI Response</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(output)}
              >
                📋 Copy
              </button>
            </div>
            <div className="ai-output">{output}</div>
          </>
        )}
      </div>
    </div>
  );
}

// MEMBERS TAB
function MembersTab({ project, currentUser, isPending }) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isOwner =
    project?.owner?._id === currentUser?._id ||
    project?.owner === currentUser?._id;

  useEffect(() => {
    // Check if current user is pending
    if (project?.pendingMembers?.some(m => (m._id || m).toString() === currentUser?._id?.toString())) {
       // isPending handled in parent
    }
  }, [project, currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true); setError(''); setSuccess('');
    try {
      await api.post(`/projects/${project._id}/members`, { email });
      setSuccess(`✓ ${email} added successfully!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
    setAdding(false);
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/projects/${project._id}/members/${memberId}`);
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">👥 Members ({project?.members?.length || 0})</span>
      </div>

      {isOwner && !isPending && (
        <div className="card card-no-hover" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ➕ Invite Member
          </h4>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="email"
              className="form-input"
              placeholder="member@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? '⟳' : 'Invite'}
            </button>
          </form>
        </div>
      )}

      <div className="members-list">
        {project?.members?.map(member => {
          const memberId = member._id || member;
          const ownerId = project?.owner?._id || project?.owner;
          const isMemberOwner = memberId?.toString() === ownerId?.toString();
          return (
            <div key={memberId} className="member-item">
              <div className="avatar">
                {(member.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="member-name">{member.name || 'Unknown User'}</div>
                <div className="member-email">{member.email || ''}</div>
              </div>
              <span className={`badge ${isMemberOwner ? 'badge-owner' : 'badge-member'}`}>
                {isMemberOwner ? '👑 Owner' : 'Member'}
              </span>
              {/* Only Owner can remove others, NO leave option for members as requested */}
              {isOwner && !isMemberOwner && !isPending && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ color: '#f87171', padding: '0.1rem 0.5rem', marginLeft: '0.5rem' }}
                  onClick={() => handleRemove(memberId)}
                  title="Remove Member"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* PENDING MEMBERS (Visible to owner) */}
      {isOwner && project?.pendingMembers?.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '700' }}>
            ⏳ Pending Invitations
          </h4>
          <div className="members-list">
            {project.pendingMembers.map(member => (
              <div key={member._id} className="member-item" style={{ opacity: 0.7 }}>
                  <div className="avatar">{(member.name || 'U').charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div className="member-name">{member.name}</div>
                    <div className="member-email">{member.email}</div>
                  </div>
                  <span className="badge">Pending</span>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: '#f87171', marginLeft: '0.5rem' }}
                    onClick={() => handleRemove(member._id)}
                    title="Cancel Invitation"
                  >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ANALYTICS TAB
function AnalyticsTab({ projectId, files, isPending }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/notes/project/${projectId}`)
      .then(nRes => {
        setNotes(nRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading analytics...</span></div>;

  const authorMap = {};
  notes.forEach(n => {
    const author = n.author?.name || 'Unknown';
    if (!authorMap[author]) authorMap[author] = { notes: 0, files: 0 };
    authorMap[author].notes++;
  });
  files.forEach(f => {
    const uploader = f.uploader?.name || 'Unknown';
    if (!authorMap[uploader]) authorMap[uploader] = { notes: 0, files: 0 };
    authorMap[uploader].files++;
  });

  const authors = Object.entries(authorMap);

  return (
    <div>
      <div className="section-header">
        <span className="section-title">📊 Contribution Analytics</span>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{notes.length}</div>
          <div className="stat-label">Total Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{files.length}</div>
          <div className="stat-label">Total Files</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{authors.length}</div>
          <div className="stat-label">Contributors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{notes.length + files.length}</div>
          <div className="stat-label">Total Activity</div>
        </div>
      </div>

      {authors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No activity yet</h3>
          <p>Start adding notes and files to see contribution stats.</p>
        </div>
      ) : (
        <div className="analytics-grid">
          {authors.map(([author, stats]) => {
            const total = stats.notes + stats.files;
            return (
              <div key={author} className="analytics-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{author}</h4>
                    <div className="av-name">{total} contribution{total !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>📝 Notes</span>
                    <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>{stats.notes}</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'var(--border)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${notes.length ? (stats.notes / notes.length) * 100 : 0}%`,
                      background: 'var(--gradient)',
                      borderRadius: '3px',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>📁 Files</span>
                    <span style={{ color: 'var(--accent2)', fontWeight: '700' }}>{stats.files}</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'var(--border)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${files.length ? (stats.files / files.length) * 100 : 0}%`,
                      background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────
function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState('code');
  const [projectFiles, setProjectFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setFilesLoading(true);
    api.get(`/files/project/${id}`)
      .then(r => setProjectFiles(r.data))
      .catch(() => {})
      .finally(() => setFilesLoading(false));
  }, [id]);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(r => setProject(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = project?.owner?._id === user?._id || project?.owner === user?._id;

  const handleToggleVisibility = async () => {
    try {
      const newVisibility = project.visibility === 'public' ? 'private' : 'public';
      const res = await api.put(`/projects/${id}`, { visibility: newVisibility });
      setProject(res.data);
      alert(`Project is now ${newVisibility.toUpperCase()}`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to change visibility.');
    }
  };

  const handleDeleteRepo = async () => {
    if (!window.confirm('WARNING: THIS IS PERMANENT.\n\nAre you sure you want to delete this repository and all its files/notes?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project.');
    }
  };

  const handleAcceptInvite = async () => {
    try {
      await api.post(`/projects/${id}/accept`);
      setIsPending(false);
      // Refresh project to get full access
      window.location.reload();
    } catch (err) {
      alert('Failed to accept invitation');
    }
  };

  const handleViewCode = async (file) => {
    // Determine if it's a file we should try to read as text
    const isText = file.originalname.match(/\.(js|jsx|ts|tsx|py|html|css|txt|json|md|java|cpp|c|go|rs|sql|sh|env|yml|yaml|xml)$/i);
    
    if (!isText) {
      // For non-text files, just open in new tab (images, pdfs, etc)
      window.open(`http://localhost:5000/uploads/${file.filename}`, '_blank');
      return;
    }

    setViewingFile(file);
    setFileContent('');
    setContentLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/uploads/${file.filename}`);
      if (!res.ok) throw new Error('Could not fetch file content');
      const text = await res.text();
      setFileContent(text);
      // Default to live for HTML, code for others
      if (file.originalname.endsWith('.html')) {
        setPreviewMode('live');
      } else {
        setPreviewMode('code');
      }
    } catch (err) {
      setFileContent(`Error loading file: ${err.message}`);
    } finally {
      setContentLoading(false);
    }
  };

  const getProcessedHTML = () => {
    if (!fileContent || !viewingFile || !viewingFile.originalname.endsWith('.html')) return '';

    let processed = fileContent;
    const serverBaseUrl = 'http://localhost:5000/uploads';

    // Helper to find file by original name in the same branch/project
    const findFile = (name) => {
        // Clean the name (remove leading ./ if present)
        const cleanName = name.replace(/^(\.\/)/, '');
        return projectFiles.find(f => f.originalname === cleanName || f.originalname.endsWith('/' + cleanName));
    };

    // 1. Rewrite <link href="...">
    processed = processed.replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, (match, p1, p2, p3) => {
        if (p2.startsWith('http') || p2.startsWith('//') || p2.startsWith('data:')) return match;
        const file = findFile(p2);
        return file ? `${p1}${serverBaseUrl}/${file.filename}${p3}` : match;
    });

    // 2. Rewrite <script src="...">
    processed = processed.replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, (match, p1, p2, p3) => {
        if (p2.startsWith('http') || p2.startsWith('//') || p2.startsWith('data:')) return match;
        const file = findFile(p2);
        return file ? `${p1}${serverBaseUrl}/${file.filename}${p3}` : match;
    });

    // 3. Rewrite <img src="...">
    processed = processed.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, p1, p2, p3) => {
        if (p2.startsWith('http') || p2.startsWith('//') || p2.startsWith('data:')) return match;
        const file = findFile(p2);
        return file ? `${p1}${serverBaseUrl}/${file.filename}${p3}` : match;
    });

    return processed;
  };

  if (loading) {
    return (
      <div className="loader" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <span>Loading project...</span>
      </div>
    );
  }

  const tabs = [
    { key: 'notes', label: '📝 Notes' },
    { key: 'files', label: '📁 Files' },
    { key: 'ai', label: '🤖 AI' },
    { key: 'members', label: '👥 Members' },
    { key: 'analytics', label: '📊 Analytics' },
  ];

  return (
    <div className="project-layout">
      {/* HERO */}
      <div className="project-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '0.75rem' }}
              onClick={() => navigate('/dashboard')}
            >
              ← All Projects
            </button>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>{project?.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              {project?.description || 'No description provided.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
            {!isPending && (
              <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const userStr = localStorage.getItem('user');
                    const token = userStr ? JSON.parse(userStr).token : '';
                    // Sanitize name for terminal compatibility (remove all special characters)
                    const projectName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
                    const cmd = `curl -L -H "Authorization: Bearer ${token}" http://localhost:5000/api/download/project/${project._id} -o ${projectName}.zip && unzip ${projectName}.zip -d ${projectName} && rm ${projectName}.zip`;
                    navigator.clipboard.writeText(cmd);
                    alert('🚀 Proper Clone Command Copied!\n\nThis command uses your secure session token to download your private files and unzip them into a project folder.\n\n⚠️ DO NOT share this command with others.');
                  }}
              >
                📥 Clone Project
              </button>
            )}
            {project?.visibility === 'public' && !isPending && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Share Link copied to clipboard!');
                }}
              >
                🔗 Share Link
              </button>
            )}
            {isOwner && (
              <>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={handleToggleVisibility}
                  title={`Switch to ${project?.visibility === 'public' ? 'Private' : 'Public'}`}
                >
                  {project?.visibility === 'public' ? '🔒 Make Private' : '🌐 Make Public'}
                </button>
                <button 
                  className="btn btn-sm" 
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                  onClick={handleDeleteRepo}
                >
                  🗑 Delete Repo
                </button>
              </>
            )}
            <span className={`badge ${project?.visibility === 'public' ? 'badge-success' : 'badge-member'}`}>
              {project?.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
            </span>
            <span className="meta-tag">👥 {project?.members?.length || 1} member{project?.members?.length !== 1 ? 's' : ''}</span>
            <span className="meta-tag">📅 {new Date(project?.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACCEPT INVITATION OVERLAY */}
      {isPending && (
        <div className="card card-no-hover" style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,0,0,0))',
            border: '1px solid var(--accent-light)',
            padding: '2.5rem', textAlign: 'center', marginBottom: '2rem'
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎉 You've been invited!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {project.owner?.name} invited you to collaborate on <strong>{project.name}</strong>. 
                Accept the invitation to start cloning and updating files.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={handleAcceptInvite}>
                    Accept Collaboration
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                    Maybe Later
                </button>
            </div>
        </div>
      )}

      {/* TAB CONTENT */}
      {!isPending && activeTab === 'notes' && <NotesTab projectId={id} user={user} />}
      {!isPending && activeTab === 'files' && (
        <FilesTab 
            projectId={id} 
            onViewFile={handleViewCode} 
            files={projectFiles} 
            setFiles={setProjectFiles} 
            loading={filesLoading} 
            isPending={isPending}
        />
      )}
      {!isPending && activeTab === 'ai' && <AITab project={project} isPending={isPending} />}
      {activeTab === 'members' && <MembersTab project={project} currentUser={user} isPending={isPending} />}
      {!isPending && activeTab === 'analytics' && <AnalyticsTab projectId={id} files={projectFiles} isPending={isPending} />}

      {/* CODE VIEWER MODAL */}
      {viewingFile && (
        <div className="modal-overlay" onClick={() => setViewingFile(null)}>
          <div className="modal" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{viewingFile.originalname}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatBytes(viewingFile.size)} · {previewMode === 'live' ? 'Live Preview' : 'Source Code View'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto', marginRight: '1rem' }}>
                {viewingFile.originalname.endsWith('.html') && (
                  <div className="tab-nav" style={{ margin: 0, padding: '0.2rem' }}>
                    <button 
                      className={`tab-btn ${previewMode === 'live' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('live')}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      🌐 Live
                    </button>
                    <button 
                      className={`tab-btn ${previewMode === 'code' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('code')}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      📜 Code
                    </button>
                  </div>
                )}
              </div>
              <button className="modal-close" onClick={() => setViewingFile(null)}>✕</button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' 
              }}>
                 <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(fileContent);
                    alert('Copied to clipboard!');
                  }}
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                 >
                   📋 Copy
                 </button>
                 <a 
                  href={`http://localhost:5000/uploads/${viewingFile.filename}`} 
                  download={viewingFile.originalname}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                 >
                   📥 Raw
                 </a>
              </div>

              {contentLoading ? (
                <div className="loader" style={{ height: '300px' }}>
                  <div className="spinner" />
                  <span>Reading file...</span>
                </div>
              ) : previewMode === 'live' ? (
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', height: '65vh', border: '1px solid var(--border)' }}>
                    <iframe
                        title="Project Preview"
                        srcDoc={getProcessedHTML()}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                </div>
              ) : (
                <pre style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  maxHeight: '65vh',
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.5rem'
                }}>
                  {fileContent}
                </pre>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewingFile(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectView;
