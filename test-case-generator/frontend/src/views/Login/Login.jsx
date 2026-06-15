import { useState } from 'react';
import { useSession } from "../../context/SessionManager";
import './Login.css';

export default function Login({ onLogin }) {
  const { login } = useSession();

  const [mode, setMode] = useState('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccessMsg('');

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
    } else if (mode === 'forgot') {
      endpoint = '/api/change-password';
      bodyPayload = { username, newPassword: password };
    }

    try {
      const res = await fetch(endpoint, {
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
        setSuccessMsg(data.message || 'Operation successful! You can now login.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // LOGIN SUCCESS
      if (!data.user || !data.token) {
        setError('Invalid server response (missing user/token).');
        return;
      }

      const normalizedUser = {
        ...data.user,
        id: data.user._id || data.user.id,
      };

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
        {successMsg && <div className="success">{successMsg}</div>}

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

          <button type="submit">
            {mode === 'register' ? 'Register' : mode === 'forgot' ? 'Update' : 'Sign in'}
          </button>
        </form>

        <div className="toggle-mode">
          {mode === 'login' && (
            <>
              <p>
                Don't have an account?{' '}
                <span className="register-link" onClick={() => switchMode('register')}>
                  Register here
                </span>
              </p>
              <p>
                <span className="register-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </span>
              </p>
            </>
          )}

          {(mode === 'register' || mode === 'forgot') && (
            <p>
              Already have an account?{' '}
              <span className="register-link" onClick={() => switchMode('login')}>
                Login here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
