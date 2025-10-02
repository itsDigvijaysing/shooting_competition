require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
const participantRoutes = require('./routes/participant');
const scoresRoutes = require('./routes/scores');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use('/api/participants', participantRoutes);
app.use('/api/scores', scoresRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Shooting Competition Backend is Running!');
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});