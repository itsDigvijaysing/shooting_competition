// controllers/participantController.js

const db = require("../config/db");

// Add a participant
const addParticipant = (req, res) => {
  const { name, zone, event, school_name, age, gender, lane_no } = req.body;
  const query = "INSERT INTO participants (name, zone, event, school_name, age, gender, lane_no) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(query, [name, zone, event, school_name, age, gender, lane_no], (err, result) => {
    if (err) {
      res.status(500).send({ message: "Error adding participant", error: err });
    } else {
      res.status(201).send({ message: "Participant added successfully", participantId: result.insertId });
    }
  });
};

// Get all participants
const getParticipants = (req, res) => {
  const { name, age } = req.query;

  let query = "SELECT * FROM participants WHERE 1=1";
  const params = [];

  if (name) {
    query += " AND name LIKE ?";
    params.push(`%${name}%`);
  }

  if (age) {
    query += " AND age = ?";
    params.push(parseInt(age));
  }

  db.query(query, params, (err, results) => {
    if (err) {
      res.status(500).send({ message: "Error fetching participants", error: err });
    } else {
      res.status(200).send(results);
    }
  });
};

module.exports = { addParticipant, getParticipants };
