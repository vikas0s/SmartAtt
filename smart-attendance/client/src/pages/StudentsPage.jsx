import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

export default function StudentsPage() {
  const { api, showToast } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/attendance/students');
      setStudents(data.data);
    } catch (error) {
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewAttendance = async (student) => {
    setSelectedStudent(student);
    try {
      const { data } = await api.get(`/attendance/student/${student._id}`);
      setStudentAttendance(data.data);
    } catch (error) {
      showToast('Failed to load attendance', 'error');
    }
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(search.toLowerCase()));
    const matchDept = !departmentFilter || s.department === departmentFilter;
    return matchSearch && matchDept;
  });

  return (
    <>
      <Header title="Students" subtitle="Manage enrolled students" />
      <div className="page-content animate-fadeIn">
        <div className="filters-row">
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or enrollment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="student-search"
            />
          </div>
          <select
            className="form-select"
            style={{ width: 200 }}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            id="department-filter"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>
            {filtered.length} students
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Enrollment</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Face Data</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👩‍🎓</div>
                        <h3>No students found</h3>
                        <p>No students match your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(student => (
                  <tr key={student._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 13, fontWeight: 600, flexShrink: 0
                        }}>
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{student.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{student.enrollmentNumber || 'N/A'}</span>
                    </td>
                    <td>{student.department || '-'}</td>
                    <td>{student.semester || '-'}</td>
                    <td>
                      <span className={`badge ${student.faceRegistered ? 'badge-success' : 'badge-danger'}`}>
                        {student.faceRegistered ? '✓ Registered' : '✗ Not set'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 60, height: 6, background: 'var(--gray-100)',
                          borderRadius: 3, overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(student.attendancePercentage, 100)}%`,
                            background: student.attendancePercentage >= 75
                              ? 'var(--success-500)' : 'var(--danger-500)',
                            borderRadius: 3,
                          }}></div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          {student.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => viewAttendance(student)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{selectedStudent.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {selectedStudent.email} • {selectedStudent.enrollmentNumber}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedStudent.attendanceCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Attended</div>
                </div>
                <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedStudent.totalSessions}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total</div>
                </div>
                <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: selectedStudent.attendancePercentage >= 75 ? 'var(--success-600)' : 'var(--danger-500)' }}>
                    {selectedStudent.attendancePercentage}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Percentage</div>
                </div>
              </div>

              <div className="card-title mb-2">Attendance History</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {studentAttendance.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                    No attendance records
                  </p>
                ) : (
                  studentAttendance.map((record, i) => (
                    <div className="feed-item" key={i}>
                      <div className={`feed-dot ${record.method}`}></div>
                      <div style={{ flex: 1 }}>
                        <div className="feed-text">{record.sessionId?.subjectName || 'Unknown'}</div>
                        <div className="feed-time">
                          {new Date(record.markedAt).toLocaleString()}
                        </div>
                      </div>
                      <span className={`badge ${record.method === 'face' ? 'badge-primary' : 'badge-warning'}`}>
                        {record.method}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
