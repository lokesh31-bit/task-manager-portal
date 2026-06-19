import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Notification from '../components/Notification';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const newErrors = {};
    
    if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long.';
    }
    
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);

    try {
      await api.post('/auth/register', {
        username: username.trim(),
        password
      });

      setNotification({
        message: 'Account registered successfully! Redirecting to login...',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      setErrors({
        api: err.response?.data?.error || 'Registration failed. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Register to manage your project tasks</p>
        </div>

        {errors.api && (
          <div className="form-error" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
            ⚠️ {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="Min 3 characters"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            {errors.username && <div className="form-error">⚠️ {errors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.password && <div className="form-error">⚠️ {errors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Re-type your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="form-error">⚠️ {errors.confirmPassword}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
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

export default Register;
