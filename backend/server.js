require('dotenv').config();
const express = require('express');
const db = require('./config/db');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/participants', require('./routes/participant'));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});