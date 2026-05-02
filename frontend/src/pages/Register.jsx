import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },,
  { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
];

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();
  const register = useStore((state) => state.register);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);

  const passwordValid = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;
    const success = await register(username, email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Register</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
              required
            />
            {passwordTouched && (
              <ul style={{ listStyle: 'none', padding: '6px 0 0', margin: 0, fontSize: '0.82rem' }}>
                {passwordRules.map((rule) => (
                  <li key={rule.label} style={{ color: rule.test(password) ? '#22c55e' : '#ef4444' }}>
                    {rule.test(password) ? '✓' : '✗'} {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <div className="alert alert-error">Passwords do not match</div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !passwordValid || !passwordsMatch}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  );
}
