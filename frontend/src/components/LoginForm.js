import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Temp Mock login function
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     // Mock login response (you can change the role as needed)
  //     const mockUser = { role: "supervisor" };
  //     onLogin(mockUser.role); // Set user role
  //     navigate(mockUser.role === "supervisor" ? "/home" : "/results"); // Redirect based on role
  //   } catch (error) {
  //     setErrorMessage("Invalid credentials. Please try again.");
  //   }
  // };

  //Actual login function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await loginUser(username, password);
      onLogin(user.role); // Set user role
      navigate(user.role === "supervisor" ? "/home" : "/results"); // Redirect based on role
    } catch (error) {
      setErrorMessage("Invalid credentials. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Login</button>
        {errorMessage && <p>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default LoginForm;
