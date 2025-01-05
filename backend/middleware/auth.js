const db = require("../config/db");
const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required" });
  }

  // Query the database to find the user by username
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) {
      return res.status(500).send({ message: "Database error", error: err });
    }

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

    // Attach token to response and proceed
    req.token = token;
    next();
  });
};

module.exports = authenticateUser;
