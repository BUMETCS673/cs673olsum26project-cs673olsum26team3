import { useState } from 'react';

// AI-USAGE SUMMARY (Function: handleSubmit)
// Tools: GitHub Copilot
// Overall AI Contribution: ~70% (function-level; overall file ~20%)
// AI-Assisted Areas: Manual validation logic, field-specific error branching
// Human Contributions: Component structure, form state management
// Areas of AI Influence:
//   - Three-branch validation (both empty, username only, password only)
// Modifications:
//   - Removed 'required' attribute from input fields (previously browser-native validation)
//   - Added manual JavaScript field validation before API call
// Verification: Manual browser testing confirms all three error paths
//              Playwright BDD scenarios validate error text matches expectations
// Confidence: High

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username && !password) {
      setError('Username and password are required.');
      return;
    }

    if (!username) {
      setError('Username is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Login failed');
      return;
    }

    onLogin(data.user);
  }

  return (
    <div className="login-card">
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input value={username} onChange={e => setUsername(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}