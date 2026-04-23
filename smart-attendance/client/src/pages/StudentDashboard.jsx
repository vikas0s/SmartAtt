import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, api, showToast } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, attendanceRes] = await Promise.all([
        api.get(`/attendance/analytics?studentId=${user._id}`),
        api.get(`/attendance/student/${user._id}`),
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentAttendance(attendanceRes.data.data.slice(0, 10));
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="My Dashboard" subtitle="Student Portal" />
        <div className="page-content">
          <div className="loading-spinner"><div className="spinner"></div></div>
        </div>
      </>
    );
  }

  const stats = analytics?.studentStats;
  const percentage = parseFloat(stats?.percentage || 0);

  return (
    <>
      <Header title="My Dashboard" subtitle={`Welcome back, ${user?.name}`} />
      <div className="page-content animate-fadeIn">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon blue">📊</div>
            <div className="stat-info">
              <h3>{percentage}%</h3>
              <p>Overall Attendance</p>
              <span className={`stat-change ${percentage >= 75 ? 'up' : 'down'}`}>
                {percentage >= 75 ? '✓ Good standing' : '⚠ Low attendance'}
              </span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon green">✅</div>
            <div className="stat-info">
              <h3>{stats?.totalAttended || 0}</h3>
              <p>Sessions Attended</p>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon orange">📅</div>
            <div className="stat-info">
              <h3>{stats?.totalSessions || 0}</h3>
              <p>Total Sessions</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon purple">🔴</div>
            <div className="stat-info">
              <h3>{analytics?.activeSessions || 0}</h3>
              <p>Active Sessions</p>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Subject-wise Attendance */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Subject-wise Attendance</div>
                <div className="card-subtitle">Your attendance per subject</div>
              </div>
            </div>
            <div className="chart-container" style={{ height: 280 }}>
              {stats?.subjectWise?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.subjectWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="attended" fill="#3b8eff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 40 }}>
                  <p style={{ color: 'var(--text-tertiary)' }}>No subject data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Attendance</div>
                <div className="card-subtitle">Your latest check-ins</div>
              </div>
            </div>
            <div className="live-feed">
              {recentAttendance.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-state-icon">📋</div>
                  <h3>No attendance yet</h3>
                  <p>Your attendance records will appear here</p>
                </div>
              ) : (
                recentAttendance.map((record, i) => (
                  <div className="feed-item" key={i}>
                    <div className={`feed-dot ${record.method}`}></div>
                    <div style={{ flex: 1 }}>
                      <div className="feed-text">
                        {record.sessionId?.subjectName || 'Unknown Subject'}
                      </div>
                      <div className="feed-time">
                        {new Date(record.markedAt).toLocaleDateString('en', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                        {' • '}
                        {new Date(record.markedAt).toLocaleTimeString('en', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <span className={`badge ${record.method === 'face' ? 'badge-primary' : 'badge-warning'}`}>
                      {record.method === 'face' ? '🧠 Face' : '📱 QR'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Attendance Visual Progress */}
        <div className="card mt-3">
          <div className="card-header">
            <div>
              <div className="card-title">Attendance Progress</div>
              <div className="card-subtitle">Minimum 75% required for eligibility</div>
            </div>
            <span className={`badge ${percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
              {percentage >= 75 ? 'Eligible' : 'At Risk'}
            </span>
          </div>
          <div style={{ position: 'relative', height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(percentage, 100)}%`,
              background: percentage >= 75
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
              borderRadius: 6,
              transition: 'width 1s ease',
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
            <span>0%</span>
            <span style={{ color: 'var(--warning-500)', fontWeight: 600 }}>75% Threshold</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </>
  );
}
