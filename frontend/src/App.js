import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import LoginForm from "./components/LoginForm";
import './App.css';

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    localStorage.setItem("role", role);
    localStorage.setItem("token", token);
  }, [role, token]);

  useEffect(() => {
    const validateSession = async () => {
      if (role && token) {
        try {
          const response = await fetch("/api/validate-session", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            localStorage.removeItem("role");
            localStorage.removeItem("token");
            setRole(null);
            setToken(null);
          }
        } catch {
          localStorage.removeItem("role");
          localStorage.removeItem("token");
          setRole(null);
          setToken(null);
        }
      }
    };
    validateSession();
  }, [role, token]);

  return (
    <Router>
      <header className="app-header">
        <div className="app-title">Shooting Competition</div>
        <nav>
          {role && token ? (
            <>
              <Link to="/home">Dashboard</Link>
              <button
                onClick={() => {
                  localStorage.removeItem("role");
                  localStorage.removeItem("token");
                  setRole(null);
                  setToken(null);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>

      <Routes>
        <Route
          path="/login"
          element={<LoginForm onLogin={(role, token) => { setRole(role); setToken(token); }} />}
        />
        <Route
          path="/home"
          element={role === "supervisor" && token ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/results"
          element={role && token ? <ResultsPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={role && token ? "/home" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
