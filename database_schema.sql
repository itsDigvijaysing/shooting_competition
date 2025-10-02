DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  event VARCHAR(10) NOT NULL,
  school_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  lane_no INT NOT NULL,
  total_score INT DEFAULT 0,
  ten_pointers INT DEFAULT 0,
  first_series_score INT DEFAULT 0,
  last_series_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_total_score (total_score),
  INDEX idx_event (event),
  INDEX idx_lane_no (lane_no)
);

CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  series_number INT NOT NULL,
  score INT DEFAULT 0,
  ten_pointers INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  INDEX idx_participant_series (participant_id, series_number),
  UNIQUE KEY unique_participant_series (participant_id, series_number)
);

INSERT INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('user', 'user123', 'user');

SHOW TABLES;

DESCRIBE users;
DESCRIBE participants;
DESCRIBE scores;
