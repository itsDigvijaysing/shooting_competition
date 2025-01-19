const jwt = require("jsonwebtoken");
const db = require("../config/db");

const login = (req, res) => {
  const { username, password } = req.body;

  // Query the database to validate user
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    console.log('trying to login');
    if (err || results.length === 0 || results[0].password !== password) {
      console.log('Invalid credentials');
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const user = results[0];

    // Generate a token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log('Login successful');
    res.status(200).send({ message: "Login successful", role: user.role, token });
  });
};

module.exports = { login };