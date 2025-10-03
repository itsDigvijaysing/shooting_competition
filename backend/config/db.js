const mysql = require("mysql2/promise");
require('dotenv').config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "NOT SET");
console.log("DB_NAME:", process.env.DB_NAME);

// Create connection pool for better Windows compatibility
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shooting_competition',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database!");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

// Create wrapper to maintain compatibility with existing code
const db = {
  execute: async (query, params = []) => {
    try {
      return await pool.execute(query, params);
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  },
  query: async (query, params = []) => {
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }
};

module.exports = db;