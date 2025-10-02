const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const db = require("../config/db");
const router = express.Router();

// Route to save series scores
router.post("/save", authenticateUser, (req, res) => {
  const { participantId, scores } = req.body;

  if (!participantId || !scores || !Array.isArray(scores)) {
    return res.status(400).send({ message: "Participant ID and scores array are required" });
  }

  // Validate scores array
  if (scores.length !== 4) {
    return res.status(400).send({ message: "Exactly 4 series scores are required" });
  }

  // Check if participant exists
  const checkParticipantQuery = "SELECT id FROM participants WHERE id = ?";
  db.query(checkParticipantQuery, [participantId], (err, results) => {
    if (err) {
      return res.status(500).send({ message: "Database error", error: err });
    }
    
    if (results.length === 0) {
      return res.status(404).send({ message: "Participant not found" });
    }

    // First, delete existing scores for this participant
    const deleteQuery = "DELETE FROM scores WHERE participant_id = ?";
    
    db.query(deleteQuery, [participantId], (err) => {
    if (err) {
      return res.status(500).send({ message: "Error deleting existing scores", error: err });
    }

    // Insert new scores
    const insertPromises = scores.map((score, index) => {
      return new Promise((resolve, reject) => {
        const insertQuery = `
          INSERT INTO scores (participant_id, series_number, score, ten_pointers)
          VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [participantId, index + 1, score.score || 0, score.ten_pointers || 0], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });

    Promise.all(insertPromises)
      .then(() => {
        // Update participant's total score
        const totalScore = scores.reduce((sum, score) => sum + (score.score || 0), 0);
        const totalTenPointers = scores.reduce((sum, score) => sum + (score.ten_pointers || 0), 0);
        const firstSeriesScore = scores.length > 0 ? (scores[0].score || 0) : 0;
        const lastSeriesScore = scores.length > 0 ? (scores[scores.length - 1].score || 0) : 0;

        const updateQuery = `
          UPDATE participants 
          SET total_score = ?, ten_pointers = ?, first_series_score = ?, last_series_score = ?
          WHERE id = ?
        `;

        db.query(updateQuery, [totalScore, totalTenPointers, firstSeriesScore, lastSeriesScore, participantId], (err) => {
          if (err) {
            return res.status(500).send({ message: "Error updating participant scores", error: err });
          }
          
          res.status(200).send({ message: "Scores saved successfully" });
        });
      })
      .catch((err) => {
        res.status(500).send({ message: "Error saving scores", error: err });
      });
    });
  });
});

// Route to get scores for a participant
router.get("/:participantId", authenticateUser, (req, res) => {
  const { participantId } = req.params;

  const query = "SELECT * FROM scores WHERE participant_id = ? ORDER BY series_number";

  db.query(query, [participantId], (err, results) => {
    if (err) {
      return res.status(500).send({ message: "Error fetching scores", error: err });
    }

    res.status(200).send(results);
  });
});

module.exports = router;