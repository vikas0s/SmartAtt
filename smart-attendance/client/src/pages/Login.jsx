import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    if (!val) { setEmailError(''); return; }
    if (val.endsWith('@attendance.in') || val.endsWith('@admin.in')) {
      setEmailError('');
    } else {
      setEmailError('Email must end with @attendance.in (student) or @admin.in (admin)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;
    if (!email.endsWith('@attendance.in') && !email.endsWith('@admin.in')) {
      setEmailError('Email must end with @attendance.in (student) or @admin.in (admin)');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slideUp">
        <div className="auth-logo">
          <div className="auth-logo-icon">📍</div>
          <h1>SmartAttend</h1>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Email Address
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                (@attendance.in or @admin.in)
              </span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="yourname@attendance.in"
              value={email}
              onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
              required
              id="login-email"
              style={emailError ? { borderColor: 'var(--danger-500)' } : {}}
            />
            {emailError && (
              <div style={{ color: 'var(--danger-500)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                ⚠️ {emailError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>

        <div style={{
          marginTop: 24,
          padding: '16px',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)'
        }}>
          <strong>Demo Credentials:</strong><br />
          Admin: admin@admin.in / admin123<br />
          Student: vikas@attendance.in / student123
        </div>
      </div>
    </div>
  );
}
