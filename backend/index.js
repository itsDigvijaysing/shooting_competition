// index.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const participantRoutes = require("./routes/participant");
const loginRoutes = require("./routes/login");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/api/login", loginRoutes);


// Routes
app.use("/api/participants", participantRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Shooting Competition Backend is Running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
