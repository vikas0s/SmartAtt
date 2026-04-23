import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

export default function SessionsPage() {
  const { api, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    subjectName: '',
    department: '',
    semester: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        api.get('/session/all'),
        api.get('/session/active'),
      ]);
      setSessions(allRes.data.data);
      setActiveSessions(activeRes.data.data);
    } catch (error) {
      showToast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...formData };
      if (payload.semester) payload.semester = parseInt(payload.semester);
      const { data } = await api.post('/session/create', payload);
      showToast('Session created successfully!', 'success');
      setShowCreateModal(false);
      setFormData({ classId: '', subjectName: '', department: '', semester: '' });
      fetchSessions();
      setShowQRModal(data.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create session', 'error');
    } finally {
      setCreating(false);
    }
  };

  const endSession = async (sessionId) => {
    try {
      await api.post(`/session/end/${sessionId}`);
      showToast('Session ended', 'info');
      fetchSessions();
    } catch (error) {
      showToast('Failed to end session', 'error');
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      <Header title="Sessions" subtitle="Manage attendance sessions" />
      <div className="page-content animate-fadeIn">
        <div className="filters-row" style={{ marginBottom: 24 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            id="create-session-btn"
          >
            ➕ Create New Session
          </button>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
            {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-500)', animation: 'pulse 2s infinite' }}></span>
              Active Sessions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {activeSessions.map(session => (
                <div className="card" key={session._id} style={{ borderLeft: '4px solid var(--success-500)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{session.subjectName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Class: {session.classId}
                      </div>
                    </div>
                    <span className="badge badge-success">● Active</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>👥 {session.markedStudents?.length || 0} marked</span>
                    <span>⏱️ {getTimeRemaining(session.expiresAt)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowQRModal(session)}
                    >
                      📱 Show QR
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => endSession(session._id)}
                    >
                      ⏹ End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Session History</div>
              <div className="card-subtitle">All past and current sessions</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Class ID</th>
                    <th>Created</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📅</div>
                          <h3>No sessions yet</h3>
                          <p>Create a session to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : sessions.map(session => (
                    <tr key={session._id}>
                      <td style={{ fontWeight: 600 }}>{session.subjectName}</td>
                      <td><span className="badge badge-primary">{session.classId}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(session.createdAt).toLocaleString('en', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>{session.markedStudents?.length || 0}</td>
                      <td>
                        <span className={`badge ${session.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {session.isActive ? '● Active' : '● Ended'}
                        </span>
                      </td>
                      <td>
                        {session.isActive ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowQRModal(session)}>
                              QR
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => endSession(session._id)}>
                              End
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Create New Session</div>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
              </div>

              <form onSubmit={createSession}>
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    required
                    id="session-subject"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Class ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CS-601-A"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                    id="session-classid"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Information Technology">IT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="form-select"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                    {creating ? 'Creating...' : 'Create Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="modal-overlay" onClick={() => setShowQRModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Session QR Code</div>
                <button className="modal-close" onClick={() => setShowQRModal(null)}>✕</button>
              </div>

              <div className="qr-display">
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{showQRModal.subjectName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Class: {showQRModal.classId}</div>
                </div>

                {showQRModal.qrCodeImage && (
                  <div className="qr-image">
                    <img src={showQRModal.qrCodeImage} alt="QR Code" />
                  </div>
                )}

                <div className="qr-timer">
                  ⏱️ Expires: {new Date(showQRModal.expiresAt).toLocaleTimeString()}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  Students can scan this QR code to mark their attendance
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
