import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'http://localhost:5000';
const PIE_COLORS = ['#3b8eff', '#f97316'];

export default function AdminDashboard() {
  const { api, showToast } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();

    const socket = io(SOCKET_URL);

    socket.on('attendance:marked', (data) => {
      setLiveFeed(prev => [data, ...prev].slice(0, 20));
      // Refresh analytics
      fetchAnalytics();
    });

    return () => socket.disconnect();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/attendance/analytics');
      setAnalytics(data.data);
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Dashboard" subtitle="Admin Overview" />
        <div className="page-content">
          <div className="loading-spinner"><div className="spinner"></div></div>
        </div>
      </>
    );
  }

  const pieData = analytics ? [
    { name: 'Face Recognition', value: analytics.methodBreakdown.face },
    { name: 'QR Code', value: analytics.methodBreakdown.qr },
  ] : [];

  return (
    <>
      <Header title="Dashboard" subtitle="Admin Overview" />
      <div className="page-content animate-fadeIn">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon blue">👩‍🎓</div>
            <div className="stat-info">
              <h3>{analytics?.totalStudents || 0}</h3>
              <p>Total Students</p>
              <span className="stat-change up">Registered</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon green">✅</div>
            <div className="stat-info">
              <h3>{analytics?.todayAttendance || 0}</h3>
              <p>Today&apos;s Attendance</p>
              <span className="stat-change up">Present today</span>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon orange">📅</div>
            <div className="stat-info">
              <h3>{analytics?.totalSessions || 0}</h3>
              <p>Total Sessions</p>
              <span className="stat-change up">All time</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon purple">🔴</div>
            <div className="stat-info">
              <h3>{analytics?.activeSessions || 0}</h3>
              <p>Active Sessions</p>
              <span className="stat-change up">Live now</span>
            </div>
          </div>
        </div>

        {/* Charts + Live Feed Row */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Weekly Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Weekly Attendance Trend</div>
                <div className="card-subtitle">Last 7 days overview</div>
              </div>
            </div>
            <div className="chart-container" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.weeklyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return d.toLocaleDateString('en', { weekday: 'short' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="count" fill="#3b8eff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Method Distribution */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Attendance Method</div>
                <div className="card-subtitle">Face vs QR distribution</div>
              </div>
            </div>
            <div className="chart-container" style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(pieData[0]?.value || pieData[1]?.value) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 20 }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No attendance data yet</p>
                </div>
              )}
              <div style={{ position: 'absolute', display: 'flex', gap: 16, bottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b8eff', display: 'inline-block' }}></span>
                  Face ({analytics?.methodBreakdown.face || 0})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', display: 'inline-block' }}></span>
                  QR ({analytics?.methodBreakdown.qr || 0})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed + Quick Actions */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📡 Live Attendance Feed</div>
                <div className="card-subtitle">Real-time updates</div>
              </div>
              <div className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● LIVE</div>
            </div>
            <div className="live-feed">
              {liveFeed.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-state-icon">📡</div>
                  <h3>Waiting for activity</h3>
                  <p>Live attendance events will appear here</p>
                </div>
              ) : (
                liveFeed.map((item, i) => (
                  <div className="feed-item" key={i}>
                    <div className={`feed-dot ${item.method}`}></div>
                    <div>
                      <div className="feed-text">
                        <strong>{item.studentName}</strong> marked via{' '}
                        <span className={`badge ${item.method === 'face' ? 'badge-primary' : 'badge-warning'}`}>
                          {item.method === 'face' ? '🧠 Face' : '📱 QR'}
                        </span>
                      </div>
                      <div className="feed-time">
                        {item.subjectName} • {new Date(item.time).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">⚡ Quick Actions</div>
                <div className="card-subtitle">Frequently used actions</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={() => navigate('/admin/sessions')}
                style={{ justifyContent: 'flex-start' }}
              >
                📅 Create New Session
              </button>
              <button
                className="btn btn-secondary btn-lg w-full"
                onClick={() => navigate('/admin/students')}
                style={{ justifyContent: 'flex-start' }}
              >
                👩‍🎓 Manage Students
              </button>
              <button
                className="btn btn-secondary btn-lg w-full"
                onClick={() => navigate('/attendance/face')}
                style={{ justifyContent: 'flex-start' }}
              >
                🧠 Face Recognition
              </button>
              <button
                className="btn btn-secondary btn-lg w-full"
                onClick={() => navigate('/admin/reports')}
                style={{ justifyContent: 'flex-start' }}
              >
                📋 View Reports
              </button>
              <button
                className="btn btn-secondary btn-lg w-full"
                onClick={() => navigate('/attendance/qr')}
                style={{ justifyContent: 'flex-start' }}
              >
                📱 QR Scanner
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
