import React, { useState } from "react";
import { loginUser } from "../services/api";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token, role } = await loginUser(username, password);
      console.log('Main Token role', token, role); // Debugging
      if (token && role) {
        onLogin(role, token); // Trigger navigation here
        window.location.href = "/dashboard"; // Ensure navigation happens
      } else {
        throw new Error("Invalid credentials.");
      }
    } catch (error) {
      console.error(error); // Debugging
      setErrorMessage("Login failed. Please check your credentials.");
    }
  };
  

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {errorMessage && <div>{errorMessage}</div>}
    </div>
  );
};

export default LoginForm;
