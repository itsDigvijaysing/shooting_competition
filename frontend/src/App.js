// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CompetitionProvider } from "./context/CompetitionContext";
import Header from "./components/Header"; // Import Header component
import AdminRoute from "./components/AdminRoute"; // Import AdminRoute component
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage"; // Separate component for registration
import LoginForm from "./components/LoginForm";
import ResultsPage from "./pages/ResultsPage";
import ScorePage from "./pages/ScorePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    // Check if user is already logged in by checking token in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (role, token) => {
    console.log("Storing token:", token);
    localStorage.setItem("token", token);
    if (role) {
      localStorage.setItem("userRole", role);
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
  };

  return (
    <CompetitionProvider>
      <div className="App">
        <Router>
          {isLoggedIn && <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
          <Routes>
            <Route
              path="/"
              element={isLoggedIn ? <HomePage /> : <Navigate to="/login" />}
            />
            <Route
              path="/register"
              element={isLoggedIn ? <AdminRoute><RegisterPage /></AdminRoute> : <Navigate to="/login" />}
            />
            <Route
              path="/results"
              element={isLoggedIn ? <ResultsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/scores"
              element={isLoggedIn ? <AdminRoute><ScorePage /></AdminRoute> : <Navigate to="/login" />}
            />
            <Route
              path="/analytics"
              element={isLoggedIn ? <AdminRoute><AnalyticsPage /></AdminRoute> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={isLoggedIn ? <AdminRoute><AdminDashboard /></AdminRoute> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/" /> : <LoginForm onLogin={handleLogin} />}
            />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
          </Routes>
        </Router>
      </div>
    </CompetitionProvider>
  );
};

export default App;
