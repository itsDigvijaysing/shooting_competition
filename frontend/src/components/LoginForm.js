import React, { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData.username, formData.password);
      onLogin(response.role, response.token);
      const token = response.token;
      console.log("Login successful, token:", token);
      navigate("/results"); // Redirect to dashboard
    } catch (error) {
      setErrorMessage(error.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="shooting-icon">🎯</div>
          <h2>Shooting Competition</h2>
          <p>Management System</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
        
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        
        <div className="demo-credentials">
          <h4>Demo Credentials</h4>
          <p><strong>Admin:</strong> username: admin, password: admin123</p>
          <p><strong>User:</strong> username: user, password: user123</p>
        </div>
        
        <div className="login-footer">
          <p>Secure competition management platform</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
