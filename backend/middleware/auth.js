const db = require("../config/db");
const jwt = require("jsonwebtoken");
const env = process.env;
require('dotenv').config();


const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(403).send({ message: 'No token provided' });
  }

  jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid token' });
    }
    req.user = decoded; // Store the decoded user data for later use
    next();  // Proceed to the next middleware or route handler
  });
};

// Login route for the user
const loginUser = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required" });
  }

  // Query the database to find the user by username
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) {
      return res.status(500).send({ message: "Database error", error: err });
    }

    // If no user found or password does not match
    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    // User is authenticated, generate JWT token
    const user = results[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).send({ message: "Login successful", token });
  });
};

// Middleware to check user authentication
const checkAuthentication = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(403).send({ message: 'No token provided' });
  }

  jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid token' });
    }
    req.user = decoded; // Store the decoded user data for later use
    next();  // Proceed to the next middleware or route handler
  });
};

module.exports = { authenticateUser, loginUser, checkAuthentication };
