import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

/* ── BTech Subject Data (with codes & lab flags) ── */
const BTECH_SUBJECTS = {
  1: [
    { code: 'MA101', name: 'Engineering Mathematics-I', isLab: false },
    { code: 'PH101', name: 'Engineering Physics', isLab: false },
    { code: 'CH101', name: 'Engineering Chemistry', isLab: false },
    { code: 'CS101', name: 'Programming for Problem Solving', isLab: false },
    { code: 'ME101', name: 'Engineering Graphics', isLab: false },
    { code: 'EE101', name: 'Basic Electrical Engineering', isLab: false },
    { code: 'EN101', name: 'English Communication', isLab: false },
    { code: 'PH101L', name: 'Physics Lab', isLab: true },
    { code: 'CH101L', name: 'Chemistry Lab', isLab: true },
    { code: 'CS101L', name: 'Programming Lab', isLab: true },
    { code: 'ME101L', name: 'Workshop Practice', isLab: true },
    { code: 'EE101L', name: 'Electrical Engineering Lab', isLab: true },
  ],
  2: [
    { code: 'MA201', name: 'Engineering Mathematics-II', isLab: false },
    { code: 'CS201', name: 'Data Structures', isLab: false },
    { code: 'CS202', name: 'Digital Logic Design', isLab: false },
    { code: 'CS203', name: 'Object Oriented Programming', isLab: false },
    { code: 'CS204', name: 'Discrete Mathematics', isLab: false },
    { code: 'EC201', name: 'Electronic Devices & Circuits', isLab: false },
    { code: 'HS201', name: 'Professional Ethics', isLab: false },
    { code: 'CS201L', name: 'Data Structures Lab', isLab: true },
    { code: 'CS202L', name: 'Digital Logic Lab', isLab: true },
    { code: 'CS203L', name: 'OOP Lab', isLab: true },
    { code: 'EC201L', name: 'Electronics Lab', isLab: true },
  ],
  3: [
    { code: 'CS301', name: 'Database Management Systems', isLab: false },
    { code: 'CS302', name: 'Operating Systems', isLab: false },
    { code: 'CS303', name: 'Computer Networks', isLab: false },
    { code: 'CS304', name: 'Design & Analysis of Algorithms', isLab: false },
    { code: 'CS305', name: 'Software Engineering', isLab: false },
    { code: 'CS306', name: 'Theory of Computation', isLab: false },
    { code: 'CS307', name: 'Compiler Design', isLab: false },
    { code: 'CS301L', name: 'DBMS Lab', isLab: true },
    { code: 'CS302L', name: 'OS Lab', isLab: true },
    { code: 'CS303L', name: 'Networking Lab', isLab: true },
    { code: 'CS305L', name: 'Software Engineering Lab', isLab: true },
  ],
  4: [
    { code: 'CS401', name: 'Machine Learning', isLab: false },
    { code: 'CS402', name: 'Artificial Intelligence', isLab: false },
    { code: 'CS403', name: 'Cloud Computing', isLab: false },
    { code: 'CS404', name: 'Information Security', isLab: false },
    { code: 'CS405', name: 'Big Data Analytics', isLab: false },
    { code: 'CS406', name: 'Internet of Things', isLab: false },
    { code: 'CS401L', name: 'ML Lab', isLab: true },
    { code: 'CS402L', name: 'AI Lab', isLab: true },
    { code: 'CS403L', name: 'Cloud Computing Lab', isLab: true },
    { code: 'CS407', name: 'Project Work', isLab: true },
  ],
};

/* ── Time Slots (8AM–4PM, 1hr each, lunch 1–2 PM) ── */
const ALL_TIME_SLOTS = [
  { id: '08-09', label: '8:00 AM – 9:00 AM', start: 8, end: 9, isLunch: false },
  { id: '09-10', label: '9:00 AM – 10:00 AM', start: 9, end: 10, isLunch: false },
  { id: '10-11', label: '10:00 AM – 11:00 AM', start: 10, end: 11, isLunch: false },
  { id: '11-12', label: '11:00 AM – 12:00 PM', start: 11, end: 12, isLunch: false },
  { id: '12-13', label: '12:00 PM – 1:00 PM', start: 12, end: 13, isLunch: false },
  { id: '13-14', label: '1:00 PM – 2:00 PM (Lunch)', start: 13, end: 14, isLunch: true },
  { id: '14-15', label: '2:00 PM – 3:00 PM', start: 14, end: 15, isLunch: false },
  { id: '15-16', label: '3:00 PM – 4:00 PM', start: 15, end: 16, isLunch: false },
];

const SECTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SessionsPage() {
  const { api, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [creating, setCreating] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  useEffect(() => { fetchSessions(); }, []);

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

  const resetWizard = () => {
    setStep(1);
    setSelectedYear('');
    setSelectedSection('');
    setSelectedSubject(null);
    setSelectedTimeSlot('');
  };

  const openCreate = () => { resetWizard(); setShowCreateModal(true); };
  const closeCreate = () => { setShowCreateModal(false); resetWizard(); };

  const handleYearSelect = (yr) => { setSelectedYear(yr); setStep(2); };
  const handleSectionSelect = (sec) => { setSelectedSection(sec); setStep(3); };
  const handleSubjectSelect = (sub) => { setSelectedSubject(sub); setStep(4); };

  const getAvailableSlots = () => {
    if (!selectedSubject) return [];
    if (selectedSubject.isLab) {
      // Lab = 2 consecutive hrs; combine pairs, skip lunch overlap
      const pairs = [];
      for (let i = 0; i < ALL_TIME_SLOTS.length - 1; i++) {
        const a = ALL_TIME_SLOTS[i];
        const b = ALL_TIME_SLOTS[i + 1];
        if (a.isLunch || b.isLunch) continue;
        if (b.start !== a.end) continue;
        pairs.push({
          id: `${a.id}_${b.id}`,
          label: `${a.label.split('–')[0].trim()} – ${b.label.split('–')[1].trim()}`,
          isLunch: false,
        });
      }
      return pairs;
    }
    return ALL_TIME_SLOTS;
  };

  const createSession = async () => {
    setCreating(true);
    try {
      const classId = `BTECH-Y${selectedYear}-${selectedSection}`;
      const payload = {
        classId,
        subjectName: `${selectedSubject.code} - ${selectedSubject.name}`,
        department: 'Computer Science',
        semester: parseInt(selectedYear) * 2,
        year: parseInt(selectedYear),
        section: selectedSection,
        timeSlot: selectedTimeSlot,
        isLab: selectedSubject.isLab,
      };
      const { data } = await api.post('/session/create', payload);
      showToast('Session created successfully!', 'success');
      closeCreate();
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

  /* ── Step indicator dots ── */
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
      {['Year', 'Section', 'Subject', 'Time Slot'].map((lbl, i) => {
        const stepNum = i + 1;
        const active = step === stepNum;
        const done = step > stepNum;
        return (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: done ? 'var(--success-500)' : active ? 'var(--gray-800)' : 'var(--gray-100)',
              color: done || active ? '#fff' : 'var(--text-tertiary)',
              transition: 'all 0.3s ease',
            }}>
              {done ? '✓' : stepNum}
            </div>
            <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{lbl}</span>
            {i < 3 && <div style={{ width: 32, height: 2, background: done ? 'var(--success-500)' : 'var(--gray-200)', borderRadius: 2 }} />}
          </div>
        );
      })}
    </div>
  );

  /* ── Wizard Steps ── */
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Select BTech Year</h4>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20 }}>Which year are you creating a session for?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1, 2, 3, 4].map(yr => (
                <button key={yr} type="button" onClick={() => handleYearSelect(yr)}
                  className="session-wizard-option" id={`year-option-${yr}`}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{['📗', '📘', '📙', '📕'][yr - 1]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{yr}{yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Semester {yr * 2 - 1} & {yr * 2}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Select Section</h4>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20 }}>
              BTech Year {selectedYear} — Choose section
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {SECTIONS.map(sec => (
                <button key={sec} type="button" onClick={() => handleSectionSelect(sec)}
                  className="session-wizard-section-btn" id={`section-option-${sec}`}>
                  {sec}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ marginTop: 16 }}>
              ← Back to Year
            </button>
          </div>
        );

      case 3: {
        const subjects = BTECH_SUBJECTS[selectedYear] || [];
        const theorySubjects = subjects.filter(s => !s.isLab);
        const labSubjects = subjects.filter(s => s.isLab);
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Select Subject</h4>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20 }}>
              Year {selectedYear} · Section {selectedSection}
            </p>
            <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {/* Theory */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>📚 Theory Subjects</div>
              {theorySubjects.map(sub => (
                <button key={sub.code} type="button" onClick={() => handleSubjectSelect(sub)}
                  className="session-wizard-subject-btn" id={`subject-${sub.code}`}>
                  <span className="badge badge-primary" style={{ fontSize: 11, minWidth: 64 }}>{sub.code}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{sub.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>1 hr</span>
                </button>
              ))}
              {/* Labs */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>🔬 Lab Subjects</div>
              {labSubjects.map(sub => (
                <button key={sub.code} type="button" onClick={() => handleSubjectSelect(sub)}
                  className="session-wizard-subject-btn lab" id={`subject-${sub.code}`}>
                  <span className="badge badge-warning" style={{ fontSize: 11, minWidth: 64 }}>{sub.code}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{sub.name}</span>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>2 hrs</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)} style={{ marginTop: 16 }}>
              ← Back to Section
            </button>
          </div>
        );
      }

      case 4: {
        const slots = getAvailableSlots();
        const slotObj = ALL_TIME_SLOTS.find(s => s.id === selectedTimeSlot) ||
          slots.find(s => s.id === selectedTimeSlot);
        return (
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Select Time Slot</h4>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 6 }}>
              {selectedSubject?.code} · Section {selectedSection} · {selectedSubject?.isLab ? '2-hour lab' : '1-hour class'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--warning-600)', textAlign: 'center', marginBottom: 20, fontWeight: 500 }}>
              🍽️ Lunch Break: 1:00 PM – 2:00 PM (No classes)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {slots.map(slot => (
                <button key={slot.id} type="button" disabled={slot.isLunch}
                  onClick={() => setSelectedTimeSlot(slot.id)}
                  className={`session-wizard-time-btn ${selectedTimeSlot === slot.id ? 'selected' : ''} ${slot.isLunch ? 'lunch' : ''}`}
                  id={`time-${slot.id}`}>
                  <span style={{ fontSize: 18 }}>{slot.isLunch ? '🍽️' : '🕐'}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{slot.label}</span>
                  {slot.isLunch && <span className="badge badge-warning" style={{ fontSize: 10 }}>Lunch</span>}
                  {selectedTimeSlot === slot.id && <span style={{ color: 'var(--success-500)', fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Summary + Create */}
            {selectedTimeSlot && (
              <div className="session-summary" style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>📋 Session Summary</div>
                <div className="session-summary-grid">
                  <div><span>Year:</span><strong>BTech Year {selectedYear}</strong></div>
                  <div><span>Section:</span><strong>{selectedSection}</strong></div>
                  <div><span>Subject:</span><strong>{selectedSubject?.code} - {selectedSubject?.name}</strong></div>
                  <div><span>Type:</span><strong>{selectedSubject?.isLab ? '🔬 Lab (2 hrs)' : '📚 Theory (1 hr)'}</strong></div>
                  <div><span>Time:</span><strong>{slotObj?.label || selectedTimeSlot}</strong></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelectedTimeSlot(''); setStep(3); }}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={createSession}
                disabled={!selectedTimeSlot || creating} style={{ flex: 1 }} id="create-session-confirm">
                {creating ? 'Creating...' : '✅ Create Session'}
              </button>
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <>
      <Header title="Sessions" subtitle="Manage attendance sessions" />
      <div className="page-content animate-fadeIn">
        <div className="filters-row" style={{ marginBottom: 24 }}>
          <button className="btn btn-primary" onClick={openCreate} id="create-session-btn">
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
                    <button className="btn btn-primary btn-sm" onClick={() => setShowQRModal(session)}>📱 Show QR</button>
                    <button className="btn btn-danger btn-sm" onClick={() => endSession(session._id)}>⏹ End</button>
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
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowQRModal(session)}>QR</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => endSession(session._id)}>End</button>
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

        {/* Create Session Wizard Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={closeCreate}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <div className="modal-title">Create New Session</div>
                <button className="modal-close" onClick={closeCreate}>✕</button>
              </div>
              <StepIndicator />
              {renderStep()}
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
