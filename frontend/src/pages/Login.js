import React, { useState } from 'react';
import '../styles/login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = {
    kitchen: { password: '1234', role: 'kitchen' },
    dining: { password: '1234', role: 'dining' },
    management: { password: '1234', role: 'management' }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const user = users[username.toLowerCase()];
    if (user && user.password === password) {
      onLogin(username.toLowerCase(), user.role);
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>SUBO HEMS</h1>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="demo-users">
          <h3>Demo Users:</h3>
          <p><strong>kitchen</strong> - Kitchen Dispatch Only</p>
          <p><strong>dining</strong> - Order Management Only</p>
          <p><strong>management</strong> - Both Pages</p>
          <p><strong>Password:</strong> 1234</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
