import { useState } from 'react';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !projectName) {
      setError('Username, password, and project name are all required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const passwordPolicy = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/;
    if (!passwordPolicy.test(password)) {
      setError('Password must include at least one number and one special character.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, projectName }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed.');
      } else {
        onRegisterSuccess(username);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to auth server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Register a new account.</p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="register-username" className="login-label">Username</label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            className="login-input"
          />

          <label htmlFor="register-password" className="login-label">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
            className="login-input"
          />

          <label htmlFor="project-name" className="login-label">Project Name</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter your project name"
            className="login-input"
          />

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>Already registered? <button type="button" className="link-button" onClick={onSwitchToLogin}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
}
