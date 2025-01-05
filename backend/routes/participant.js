const express = require("express");
const authenticateUser = require("../middleware/auth");
const db = require("../config/db");
const jwt = require('jsonwebtoken');
const env = require('../.env');
const router = express.Router();


// Route to add a participant (authentication required)
// POST route for adding a new participant
// Authentication required
router.post("/add", authenticateUser, (req, res) => {
    // Destructure input fields
    const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  
    // Validation: Ensure all fields are provided
    if (!name || !zone || !event || !school_name || !age || !gender || !lane_no) {
      return res.status(400).send({ message: "All fields are required" });
    }
  
    // SQL query to add a new participant
    const query = `
      INSERT INTO participants (name, zone, event, school_name, age, gender, lane_no)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute query and handle result
    db.query(query, [name, zone, event, school_name, age, gender, lane_no], (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Error adding participant", error: err });
      }
      res.status(200).send({ message: "Participant added successfully" });
    });
  });
  
  
  

  router.post("/login", (req, res) => {
    const { username, password } = req.body; // Ensure you're getting the credentials
    // Verify username and password here (add your authentication logic)
  
    const user = { username };  // Create a user object after validating the credentials
  
    // Generate a JWT token
    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '1h' });
  
    res.status(200).send({ message: "Login successful", token: token });
  });

// participant.js
router.get("/", authenticateUser, (req, res) => {
    const query = "SELECT * FROM participants";
  
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Error fetching participants", error: err });
      }
      if (result.length === 0) {
        return res.status(404).send({ message: "No participants found" });
      }
      res.status(200).send(result);
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
  
  // participant.js
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
