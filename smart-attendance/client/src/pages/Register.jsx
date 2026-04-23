import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    enrollmentNumber: '',
    department: '',
    semester: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData };
    if (payload.semester) payload.semester = parseInt(payload.semester);
    // Remove empty optional fields to avoid duplicate key errors
    if (!payload.enrollmentNumber) delete payload.enrollmentNumber;
    if (!payload.department) delete payload.department;
    if (!payload.semester) delete payload.semester;
    const result = await register(payload);
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

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register to start tracking attendance</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="role-selector">
            <div
              className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'student' })}
            >
              <div className="role-option-icon">👩‍🎓</div>
              <div className="role-option-label">Student</div>
            </div>
            <div
              className={`role-option ${formData.role === 'admin' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'admin' })}
            >
              <div className="role-option-icon">👨‍💼</div>
              <div className="role-option-label">Admin</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              id="register-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              id="register-email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              id="register-password"
            />
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label">Enrollment Number</label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  className="form-input"
                  placeholder="CS2024001"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  id="register-enrollment"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                    id="register-department"
                  >
                    <option value="">Select</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    name="semester"
                    className="form-select"
                    value={formData.semester}
                    onChange={handleChange}
                    id="register-semester"
                  >
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="register-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
