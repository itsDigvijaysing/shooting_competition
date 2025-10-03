const db = require("../config/db");
const jwt = require("jsonwebtoken");
require('dotenv').config();


const authenticateUser = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send({ message: 'Invalid token.' });
  }
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
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).send({ message: "Login successful", token, role: user.role });
  });
};

// Middleware to check user authentication
const checkAuthentication = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(403).send({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid token' });
    }
    req.user = decoded; // Store the decoded user data for later use
    next();  // Proceed to the next middleware or route handler
  });
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = { authenticateUser, loginUser, checkAuthentication, requireAdmin };
