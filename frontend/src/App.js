import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import LoginForm from "./components/LoginForm";

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  return (
    <Router>
      <nav>
        {role ? (
          <>
            <Link to={role === "supervisor" ? "/home" : "/results"}>Dashboard</Link> |{" "}
            <button onClick={() => setRole(null)}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<LoginForm onLogin={setRole} />} />
        <Route
          path="/home"
          element={
            role === "supervisor" ? <HomePage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to={role ? "/home" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
