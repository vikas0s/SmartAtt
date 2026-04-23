import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/students', icon: '👩‍🎓', label: 'Students' },
    { to: '/admin/sessions', icon: '📅', label: 'Sessions' },
    { to: '/admin/reports', icon: '📋', label: 'Reports' },
  ];

  const studentLinks = [
    { to: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/attendance/face', icon: '🧠', label: 'Face Check-in' },
    { to: '/attendance/qr', icon: '📱', label: 'QR Check-in' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">📍</div>
        <h1>
          SmartAttend
          <span>Attendance System</span>
        </h1>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            {isAdmin ? 'Administration' : 'Student Portal'}
          </div>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Attendance</div>
            <NavLink
              to="/attendance/face"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">🧠</span>
              Face Recognition
            </NavLink>
            <NavLink
              to="/attendance/qr"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">📱</span>
              QR Scanner
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
}
