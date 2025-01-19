// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";
import './Header.css'; // Add any styles for the header here

const Header = ({ isLoggedIn, onLogout }) => {
  return (
    <header className="app-header">
      <h1 style={{color:"#fff"}}>Shooting Competition</h1>
      <div className="header-links">
        {isLoggedIn ? (
          <>
            <Link to="/">Home</Link> {/* Link to Home */}
            <Link to="/register">Register</Link> {/* Link to Register (Dashboard) */}
            <Link to="/results">Results</Link> {/* Link to Results */}
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
