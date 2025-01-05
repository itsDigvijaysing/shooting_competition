const express = require("express");
const authenticateUser = require("../middleware/auth");
const db = require("../config/db");

const router = express.Router();
router.post("/add", authenticateUser, (req, res) => {
  const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  res.status(200).send({ message: "Participant added successfully" });
});

router.post("/login", (req, res) => {
  res.status(200).send({ message: "Login successful", token: req.token });
});

router.get("/", authenticateUser, (req, res) => {
    const query = "SELECT * FROM participants";  // SQL query to fetch all participants
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).send({ message: "Error retrieving participants", error: err });
      }
      res.status(200).send({ participants: results });
    });
  });

// Route to update a participant's information (authentication required)
router.put("/update/:id", authenticateUser, (req, res) => {
    const { id } = req.params;
    const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  
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
