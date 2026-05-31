import { useState } from 'react';
import './Login.css';

/**
 * Login Component
 * Retains exact working functional dispatch pipeline with refined design system classes.
 */
export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Exact asynchronous API payload authentication from the working baseline
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed');
        return;
      }

      // Clear form and proceed with login
      setUsername('');
      setPassword('');
      onLogin(data.user);
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
    }
  }

  return (
    <div className="login-view-container">
      <div className="login-card">
        <h1>Login</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-control-group">
            <label>Username</label>
            <input 
              type="text"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              autoComplete="username"
            />
          </div>
          
          <div className="form-control-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}