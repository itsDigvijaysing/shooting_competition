const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the database to validate user
    const [results] = await db.execute(
      "SELECT * FROM users WHERE username = ? AND is_active = TRUE", 
      [username]
    );
    
    console.log('Attempting login for:', username);
    
    if (results.length === 0) {
      console.log('User not found or inactive');
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const user = results[0];

    // Check password - support both plain text (for demo) and bcrypt
    let passwordValid = false;
    
    // Check if password is hashed (starts with $2b$ for bcrypt)
    if (user.password.startsWith('$2b$')) {
      // Use bcrypt comparison for hashed passwords
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Use plain text comparison for demo users
      passwordValid = (user.password === password);
    }
    
    if (!passwordValid) {
      console.log('Invalid password');
      return res.status(401).send({ message: "Invalid credentials" });
    }

    // Generate a token
    const token = jwt.sign(
      { 
        id: user.id, 
        userId: user.id, 
        role: user.role, 
        username: user.username 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    console.log('Login successful for:', username);
    res.status(200).send({ 
      message: "Login successful", 
      role: user.role, 
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send({ message: "Server error during login" });
  }
};

module.exports = { login };