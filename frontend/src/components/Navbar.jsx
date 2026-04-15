import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (document.body.classList.contains('light-mode')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove('light-mode');
      setIsLightMode(false);
    } else {
      document.body.classList.add('light-mode');
      setIsLightMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', borderRadius: '50%' }}>
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {token && (
            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
              Hello, {user.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          )}
          <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
            <Link to={user.role === 'admin' ? '/admin' : '/student'} className="nav-logo">
              RankUp
            </Link>
          </div>
        </div>
        <div className="nav-links">
          {token ? (
            <>
              <span style={{ color: 'var(--text-muted)' }}>{user.username}</span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ border: 'none' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
