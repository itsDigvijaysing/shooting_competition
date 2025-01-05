import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import LoginForm from "./components/LoginForm";

function App() {
  const [role, setRole] = useState(null); // Null means not logged in

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
        <Route path="/home" element={role === "supervisor" ? <HomePage /> : <ResultsPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
