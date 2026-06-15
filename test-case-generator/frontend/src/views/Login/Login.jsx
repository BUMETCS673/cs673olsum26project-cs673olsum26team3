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

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (mode === 'register') {
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
    }

    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Request failed.');
        return;
      }

      // REGISTER
      if (mode === 'register') {
        setSuccessMsg(data.message || 'Account created!');
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
      setError('Server not reachable. Check backend.');
    }
  }

  const getHeader = () => {
    if (mode === 'register') return 'Create Account';
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-control-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-control-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          <button type="submit">
            {mode === 'register' ? 'Register' : 'Sign in'}
          </button>
        </form>

        <div className="toggle-mode">
          {mode === 'login' && (
            <p>
              No account?{' '}              
              <span className="register-link" onClick={() => switchMode('register')}>
                Register
              </span>
            </p>
          )}

          {mode === 'register' && (
            <p>
               Already have an account?{' '}   
              <span className="register-link" onClick={() => switchMode('login')}>
                Back to login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
