require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
const participantRoutes = require('./routes/participant');
const scoresRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/login');
const competitionsRoutes = require('./routes/competitions');
const rankingsRoutes = require('./routes/rankings');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use('/api/login', loginRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', competitionsRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/rankings', rankingsRoutes);

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