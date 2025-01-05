const db = require("../config/db");

const login = (req, res) => {
  const { username, password } = req.body;

  // Query the database to validate user
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err || results.length === 0 || results[0].password !== password) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const user = results[0];
    res.status(200).send({ message: "Login successful", role: user.role });
  });
};

module.exports = { login };
