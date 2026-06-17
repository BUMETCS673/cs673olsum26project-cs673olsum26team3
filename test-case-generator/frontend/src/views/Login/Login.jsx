// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
import { useState } from 'react';
import { useSession } from "../../context/SessionManager";
import './Login.css';
import { API_URL } from '../../config';

/**
 * Login Component
 * Handles user authentication, new user registration, and password updates.
 */
export default function Login({ onLogin }) {
  const { login } = useSession();

  // Mode toggle states: 'login', 'register', 'forgot'
  const [mode, setMode] = useState('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Resets form state when switching modes.
   */
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  /**
   * Handles form submission based on the current mode.
   */
  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccessMsg('');

    // Validation for registration and password change
    if ((mode === 'register' || mode === 'forgot') && password !== confirmPassword) {
      setError('Passwords do not match. Please re-type them.');
      return;
    }

    if (mode === 'register' || mode === 'forgot') {
      const passwordComplexityRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordComplexityRegex.test(password)) {
        setError(
          'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
        );
        return;
      }
    }

    let endpoint = '/api/login';
    let bodyPayload = { username, password };

    if (mode === 'register') {
      endpoint = '/api/register';
      bodyPayload = { username, password };
    } else if (mode === 'forgot') {
      endpoint = '/api/change-password';
      bodyPayload = { username, newPassword: password };
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      if (mode === 'register' || mode === 'forgot') {
        // Notify user and switch back to login mode
        setSuccessMsg(data.message || 'Operation successful! You can now login.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // Successful login
      if (!data.user || !data.token) {
        setError('Invalid server response (missing user/token).');
        return;
      }

      const normalizedUser = {
        ...data.user,
        id: data.user._id || data.user.id,
      };

      // Store JWT token and user info via session manager
      login(normalizedUser, data.token);

      setUsername('');
      setPassword('');
      setConfirmPassword('');

      if (onLogin) {
        onLogin(normalizedUser);
      }

    } catch (err) {
      setError('Could not connect to the server. Please check your connection.');
    }
  }

  // Determine header text based on mode
  const getHeader = () => {
    if (mode === 'register') return 'Create Account';
    if (mode === 'forgot') return 'Update Password';
    return 'Login';
  };

  return (
    <div className="login-view-container">
      <div className="login-card">
        <h1>{getHeader()}</h1>

        {error && <div className="error">{error}</div>}
        {successMsg && <div className="success" style={{ color: '#10b981', marginBottom: '1rem', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-control-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-control-group">
            <label>{mode === 'forgot' ? 'New Password' : 'Password'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {(mode === 'register' || mode === 'forgot') && (
            <div className="form-control-group">
              <label>Confirm {mode === 'forgot' ? 'New ' : ''}Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button 
            type="submit"
            style={{ transition: 'all 0.2s ease' }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {mode === 'register' ? 'Register' : mode === 'forgot' ? 'Update' : 'Sign in'}
          </button>
        </form>

        <div className="toggle-mode" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '13px' }}>
          {mode === 'login' && (
            <>
              <p>
                Don't have an account?{' '}
                <span className="register-link" onClick={() => switchMode('register')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}>
                  Register here
                </span>
              </p>
              <p style={{ marginTop: '8px' }}>
                <span className="register-link" onClick={() => switchMode('forgot')} style={{ color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>
                  Forgot password?
                </span>
              </p>
            </>
          )}

          {(mode === 'register' || mode === 'forgot') && (
            <p>
              Already have an account?{' '}
              <span className="register-link" onClick={() => switchMode('login')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}>
                Login here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
