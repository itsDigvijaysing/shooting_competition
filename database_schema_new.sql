-- Comprehensive Shooting Competition Database Schema
-- Run these commands in your MySQL database

-- Create database (optional - if you haven't created it yet)
-- CREATE DATABASE shooting_competition;
-- USE shooting_competition;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS shots;
DROP TABLE IF EXISTS series_scores;
DROP TABLE IF EXISTS participant_details;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS competition_details;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS users;

-- Users table for authentication and participant access
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'participant') DEFAULT 'participant',
  full_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_username (username)
);

-- Competitions table for multiple competitions management
CREATE TABLE competitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  year YEAR NOT NULL,
  description TEXT,
  max_series_count ENUM('4', '6') DEFAULT '4',
  status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
  start_date DATE,
  end_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_year (year),
  INDEX idx_status (status)
);

-- Competition Details table for timing and lane management
CREATE TABLE competition_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT NOT NULL,
  detail_name VARCHAR(50) NOT NULL, -- Detail 1, Detail 2, etc.
  timing_start TIME NOT NULL,
  timing_end TIME NOT NULL,
  date DATE NOT NULL,
  max_lanes INT DEFAULT 50,
  section_type ENUM('main', 'final') DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  INDEX idx_competition_detail (competition_id, detail_name)
);

-- Enhanced Participants table
CREATE TABLE participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, -- Link to users table
  competition_id INT NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  event ENUM('AP', 'PS', 'OS') NOT NULL, -- Air Pistol, Peep Site, Open Site
  school_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  age_category ENUM('under_14', 'under_17', 'under_19') NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  lane_no INT NOT NULL,
  detail_id INT, -- Which detail they belong to
  section_type ENUM('main', 'final') DEFAULT 'main',
  series_count INT DEFAULT 4, -- 4 or 6 series
  total_score INT DEFAULT 0,
  ten_pointers INT DEFAULT 0,
  first_series_score INT DEFAULT 0,
  last_series_score INT DEFAULT 0,
  is_qualified_for_final BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (detail_id) REFERENCES competition_details(id),
  UNIQUE KEY unique_competition_lane (competition_id, lane_no, detail_id),
  INDEX idx_competition (competition_id),
  INDEX idx_event (event),
  INDEX idx_age_category (age_category),
  INDEX idx_total_score (total_score),
  INDEX idx_detail (detail_id)
);

-- Series Scores table for individual series
CREATE TABLE series_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  series_number INT NOT NULL, -- 1, 2, 3, 4 (or up to 6)
  total_score INT DEFAULT 0, -- Total score for this series (out of 100)
  ten_pointers INT DEFAULT 0, -- Number of 10-pointers in this series
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant_series (participant_id, series_number),
  INDEX idx_participant_series (participant_id, series_number)
);

-- Individual Shots table for detailed tracking (10 shots per series)
CREATE TABLE shots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_score_id INT NOT NULL,
  shot_number INT NOT NULL, -- 1 to 10
  score INT NOT NULL, -- Individual shot score (0-10)
  is_ten_pointer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_score_id) REFERENCES series_scores(id) ON DELETE CASCADE,
  UNIQUE KEY unique_series_shot (series_score_id, shot_number),
  INDEX idx_series_shot (series_score_id, shot_number)
);

-- Insert default admin and sample users
INSERT INTO users (username, password, role, full_name, email) VALUES 
('admin', 'admin123', 'admin', 'System Administrator', 'admin@shooting.com'),
('participant1', 'user123', 'participant', 'John Doe', 'john@example.com'),
('participant2', 'user123', 'participant', 'Jane Smith', 'jane@example.com');

-- Insert sample competition
INSERT INTO competitions (name, year, description, max_series_count, status, created_by) VALUES 
('Annual Shooting Championship 2025', 2025, 'Annual inter-school shooting competition', '4', 'active', 1);

-- Insert sample competition details
INSERT INTO competition_details (competition_id, detail_name, timing_start, timing_end, date, max_lanes, section_type) VALUES 
(1, 'Detail 1', '09:00:00', '11:00:00', '2025-01-15', 25, 'main'),
(1, 'Detail 2', '11:30:00', '13:30:00', '2025-01-15', 25, 'main'),
(1, 'Final Detail', '15:00:00', '17:00:00', '2025-01-15', 10, 'final');

-- Show tables to verify creation
SHOW TABLES;

-- Display table structures
DESCRIBE users;
DESCRIBE competitions;
DESCRIBE competition_details;
DESCRIBE participants;
DESCRIBE series_scores;
DESCRIBE shots;