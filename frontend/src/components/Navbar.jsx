import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [username, setUsername] = useState('');

  // Extract username from localStorage
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUsername(user.username);
      } catch (err) {
        setUsername('');
      }
    } else {
      setUsername('');
    }
  }, [location]); // Refresh on navigation changes (like logging in)

  // Sync theme to body element
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <nav className="navbar">
      <div className="nav-brand">
        🚀 TaskFlow
      </div>

      {isLoggedIn && (
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/add-task" 
              className={`nav-link ${location.pathname === '/add-task' ? 'active' : ''}`}
            >
              + Add Task
            </Link>
          </li>
        </ul>
      )}

      <div className="nav-actions">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="btn-icon" 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isLoggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              👤 {username}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
