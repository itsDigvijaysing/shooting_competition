import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isLoggedIn, onLogout }) => {
  return (
    <header className="header">
      <h1>Shooting Competition App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/home">Dashboard</Link>
          </li>
          {!isLoggedIn ? (
            <li>
              <Link to="/login">Login</Link>
            </li>
          ) : (
            <li>
              <button onClick={onLogout}>Logout</button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
