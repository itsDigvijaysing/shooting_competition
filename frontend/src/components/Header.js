// src/components/Header.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import './Header.css';

const Header = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  
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
            <li>
              <Link to="/register" className={isActive('/register')}>
                <span className="nav-icon">📝</span>
                Register
              </Link>
            </li>
            <li>
              <Link to="/results" className={isActive('/results')}>
                <span className="nav-icon">🏆</span>
                Results
              </Link>
            </li>
            <li>
              <button onClick={onLogout} className="logout-button">
                <span className="nav-icon">🚪</span>
                Logout
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
