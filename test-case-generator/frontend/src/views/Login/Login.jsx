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
  const [isLoading, setIsLoading] = useState(false);

  // Exact asynchronous API payload authentication from the working baseline
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Clear form and proceed with login
      setUsername('');
      setPassword('');
      onLogin(data.user);
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
      setIsLoading(false);
    }
  }

  // Handle Enter key press on input fields
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

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
              onKeyDown={handleKeyDown}
              disabled={isLoading}
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
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              required 
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
