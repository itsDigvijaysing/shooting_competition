const express = require("express");
const { addParticipant, getParticipants } = require("../controllers/participantController");

const router = express.Router();

// Routes
router.post("/add", addParticipant);
router.get("/", getParticipants);

module.exports = router;
