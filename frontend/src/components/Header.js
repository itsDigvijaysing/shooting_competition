// src/components/Header.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import './Header.css';

const Header = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === 'admin';
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">🎯</div>
        <h1 className="header-title">Shooting Competition</h1>
      </div>
      
      <nav className="header-nav">
        {isLoggedIn ? (
          <ul>
            <li>
              <Link to="/" className={isActive('/')}>
                <span className="nav-icon">🏠</span>
                Home
              </Link>
            </li>
            {/* Participant Registration - Available to both admin and participants */}
            <li>
              <Link to="/register" className={isActive('/register')}>
                <span className="nav-icon">📝</span>
                {isAdmin ? 'Register Participant' : 'My Registration'}
              </Link>
            </li>
            {/* Score Entry - Admin only */}
            {isAdmin && (
              <li>
                <Link to="/scores" className={isActive('/scores')}>
                  <span className="nav-icon">🎯</span>
                  Score Entry
                </Link>
              </li>
            )}
            {/* Results - Available to both */}
            <li>
              <Link to="/results" className={isActive('/results')}>
                <span className="nav-icon">🏆</span>
                Results
              </Link>
            </li>
            {/* Analytics - Admin only */}
            {isAdmin && (
              <li>
                <Link to="/analytics" className={isActive('/analytics')}>
                  <span className="nav-icon">📊</span>
                  Analytics
                </Link>
              </li>
            )}
            {/* Admin Panel - Admin only */}
            {isAdmin && (
              <li>
                <Link to="/admin" className={isActive('/admin')}>
                  <span className="nav-icon">⚙️</span>
                  Admin Panel
                </Link>
              </li>
            )}
            <li>
              <button onClick={onLogout} className="logout-button">
                <span className="nav-icon">🚪</span>
                Logout ({userRole})
              </button>
            </li>
          </ul>
        ) : (
          <ul>
            <li>
              <Link to="/login">
                <span className="nav-icon">🔐</span>
                Login
              </Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
};

export default Header;
