import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const { api, showToast } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    studentId: '',
    subjectName: '',
  });
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchReport();
    fetchStudents();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/attendance/report?${params.toString()}`);
      setReportData(data.data);
    } catch (error) {
      showToast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/attendance/students');
      setStudents(data.data);
    } catch (error) {
      // Silently fail
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    const headers = ['Student Name', 'Email', 'Enrollment', 'Subject', 'Method', 'Date', 'Status'];
    const rows = reportData.map(r => [
      r.studentId?.name || '',
      r.studentId?.email || '',
      r.studentId?.enrollmentNumber || '',
      r.sessionId?.subjectName || '',
      r.method,
      new Date(r.markedAt).toLocaleString(),
      r.status,
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
  };

  return (
    <>
      <Header title="Reports" subtitle="Attendance reports and analytics" />
      <div className="page-content animate-fadeIn">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">🔍 Filters</div>
            <button className="btn btn-primary btn-sm" onClick={exportCSV}>
              📥 Export CSV
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search subject..."
                value={filters.subjectName}
                onChange={(e) => setFilters({ ...filters, subjectName: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Student</label>
              <select
                className="form-select"
                value={filters.studentId}
                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
              >
                <option value="">All Students</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={fetchReport}>
              Apply Filters
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setFilters({ startDate: '', endDate: '', studentId: '', subjectName: '' });
              setTimeout(fetchReport, 100);
            }}>
              Clear
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Attendance Records</div>
              <div className="card-subtitle">{reportData.length} records found</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrollment</th>
                    <th>Subject</th>
                    <th>Method</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📋</div>
                          <h3>No records found</h3>
                          <p>Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : reportData.map((record, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--primary-100)', color: 'var(--primary-700)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600
                          }}>
                            {record.studentId?.name?.charAt(0) || '?'}
                          </div>
                          <span style={{ fontWeight: 500 }}>{record.studentId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {record.studentId?.enrollmentNumber || 'N/A'}
                        </span>
                      </td>
                      <td>{record.sessionId?.subjectName || '-'}</td>
                      <td>
                        <span className={`badge ${record.method === 'face' ? 'badge-purple' : 'badge-warning'}`}>
                          {record.method === 'face' ? '🧠 Face' : '📱 QR'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(record.markedAt).toLocaleString('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`badge ${record.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
