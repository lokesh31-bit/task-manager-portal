import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Notification from '../components/Notification';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }

    if (searchParams.get('session_expired')) {
      setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotification({ message: '', type: '' });

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password
      });

      // Save to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setNotification({ message: 'Login successful! Redirecting...', type: 'success' });
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);

    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to manage your project tasks</p>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
    </div>
  );
};

export default Login;
