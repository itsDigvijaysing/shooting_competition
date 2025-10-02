const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const db = require("../config/db");
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

// Route to add a participant (authentication required)
router.post("/add", authenticateUser, (req, res) => {
    // Destructure input fields
    const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  
    // Validation: Ensure all fields are provided
    if (!name || !zone || !event || !school_name || !age || !gender || !lane_no) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Validation: Check age range
    if (age < 10 || age > 25) {
      return res.status(400).send({ message: "Age must be between 10 and 25" });
    }

    // Validation: Check lane number range
    if (lane_no < 1 || lane_no > 50) {
      return res.status(400).send({ message: "Lane number must be between 1 and 50" });
    }

    // Check if lane number is already taken
    const checkLaneQuery = "SELECT id FROM participants WHERE lane_no = ?";
    db.query(checkLaneQuery, [lane_no], (err, results) => {
      if (err) {
        return res.status(500).send({ message: "Database error", error: err });
      }
      
      if (results.length > 0) {
        return res.status(400).send({ message: "Lane number is already taken" });
      }

      // SQL query to add a new participant
      const query = `
        INSERT INTO participants (name, zone, event, school_name, age, gender, lane_no, total_score, ten_pointers, first_series_score, last_series_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
      `;
      
      // Execute query and handle result
      db.query(query, [name, zone, event, school_name, age, gender, lane_no], (err, result) => {
        if (err) {
          return res.status(500).send({ message: "Error adding participant", error: err });
        }
        res.status(200).send({ message: "Participant added successfully" });
      });
    });
});

// Route to login (generate JWT token)
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: "Username and password are required" });
    }
  
    // Query the database to find the user by username
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Database error", error: err });
        }

        if (results.length === 0 || results[0].password !== password) {
            return res.status(401).send({ message: "Invalid credentials" });
        }

        const user = results[0];
  
        // Generate a JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
  
        res.status(200).send({ 
            message: "Login successful", 
            token: token, 
            role: user.role 
        });
    });
});

// Route to get all participants (authentication required)
router.get("/", authenticateUser, (req, res) => {
    const query = "SELECT * FROM participants ORDER BY total_score DESC, last_series_score DESC, first_series_score DESC, ten_pointers DESC";
  
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Error fetching participants", error: err });
      }
      res.status(200).send(result || []);
    });
});

// Route to update a participant's information (authentication required)
router.put("/update/:id", authenticateUser, (req, res) => {
    const { id } = req.params;
    const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  
    // Validation
    if (!name || !zone || !event || !school_name || !age || !gender || !lane_no) {
      return res.status(400).send({ message: "All fields are required" });
    }
  
    const query = `
      UPDATE participants
      SET name = ?, zone = ?, event = ?, school_name = ?, age = ?, gender = ?, lane_no = ?
      WHERE id = ?
    `;
  
    db.query(query, [name, zone, event, school_name, age, gender, lane_no, id], (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Error updating participant", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Participant not found" });
      }
      res.status(200).send({ message: "Participant updated successfully" });
    });
});
  
// Route to delete a participant (authentication required)
router.delete("/delete/:id", authenticateUser, (req, res) => {
    const { id } = req.params;
  
    const query = "DELETE FROM participants WHERE id = ?";
  
    db.query(query, [id], (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Error deleting participant", error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Participant not found" });
      }
      res.status(200).send({ message: "Participant deleted successfully" });
    });
});

module.exports = router;