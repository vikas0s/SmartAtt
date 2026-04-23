import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div>
          <h2>{title}</h2>
          {subtitle && <div className="header-breadcrumb">{subtitle}</div>}
        </div>
      </div>
      <div className="header-right">
        <div style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          🟢 <span>System Active</span>
        </div>
      </div>
    </header>
  );
}
