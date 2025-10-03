-- =============================================================================
-- COMPLETE SHOOTING COMPETITION DATABASE SETUP SCRIPT
-- =============================================================================
-- This script will create a complete shooting competition database from scratch
-- Run this script after dropping the existing database if needed
-- =============================================================================

-- Drop and recreate the database (CAUTION: This will delete all existing data)
DROP DATABASE IF EXISTS shooting_competition;
CREATE DATABASE shooting_competition;
USE shooting_competition;

-- =============================================================================
-- TABLE CREATION
-- =============================================================================

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
  INDEX idx_username (username),
  INDEX idx_active (is_active)
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
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_year (year),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_name_year (name, year)
);

-- Competition Details table for timing and lane management
CREATE TABLE competition_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT NOT NULL,
  detail_name VARCHAR(50) NOT NULL,
  timing_start TIME NOT NULL,
  timing_end TIME NOT NULL,
  date DATE NOT NULL,
  max_lanes INT DEFAULT 50,
  section_type ENUM('main', 'final') DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_competition_detail (competition_id, detail_name),
  INDEX idx_competition_detail (competition_id, detail_name),
  INDEX idx_date (date),
  INDEX idx_section_type (section_type)
);

-- Enhanced Participants table
CREATE TABLE participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  competition_id INT NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  event ENUM('AP', 'PS', 'OS') NOT NULL COMMENT 'Air Pistol, Peep Site, Open Site',
  school_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  age_category ENUM('under_14', 'under_17', 'under_19') NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  lane_no INT NOT NULL,
  detail_id INT NULL,
  section_type ENUM('main', 'final') DEFAULT 'main',
  series_count INT DEFAULT 4,
  total_score INT DEFAULT 0,
  ten_pointers INT DEFAULT 0,
  first_series_score INT DEFAULT 0,
  last_series_score INT DEFAULT 0,
  is_qualified_for_final BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (detail_id) REFERENCES competition_details(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_competition (user_id, competition_id),
  UNIQUE KEY unique_competition_lane_detail (competition_id, lane_no, detail_id),
  INDEX idx_competition (competition_id),
  INDEX idx_user (user_id),
  INDEX idx_event (event),
  INDEX idx_age_category (age_category),
  INDEX idx_gender (gender),
  INDEX idx_total_score (total_score DESC),
  INDEX idx_detail (detail_id),
  INDEX idx_section_type (section_type),
  INDEX idx_lane (lane_no),
  INDEX idx_qualified (is_qualified_for_final),
  CONSTRAINT chk_age CHECK (age >= 10 AND age <= 25),
  CONSTRAINT chk_lane CHECK (lane_no >= 1 AND lane_no <= 100),
  CONSTRAINT chk_scores CHECK (total_score >= 0 AND total_score <= 600)
);

-- Series Scores table for individual series tracking
CREATE TABLE series_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  series_number INT NOT NULL,
  total_score INT DEFAULT 0,
  ten_pointers INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant_series (participant_id, series_number),
  INDEX idx_participant_series (participant_id, series_number),
  INDEX idx_series_score (total_score DESC),
  CONSTRAINT chk_series_number CHECK (series_number >= 1 AND series_number <= 6),
  CONSTRAINT chk_series_score CHECK (total_score >= 0 AND total_score <= 100),
  CONSTRAINT chk_ten_pointers CHECK (ten_pointers >= 0 AND ten_pointers <= 10)
);

-- Individual Shots table for detailed shot tracking (10 shots per series)
CREATE TABLE shots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_score_id INT NOT NULL,
  shot_number INT NOT NULL,
  score INT NOT NULL,
  is_ten_pointer BOOLEAN DEFAULT FALSE,
  ring_value DECIMAL(3,1) NULL COMMENT 'Precise ring value for scoring',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_score_id) REFERENCES series_scores(id) ON DELETE CASCADE,
  UNIQUE KEY unique_series_shot (series_score_id, shot_number),
  INDEX idx_series_shot (series_score_id, shot_number),
  INDEX idx_score (score DESC),
  CONSTRAINT chk_shot_number CHECK (shot_number >= 1 AND shot_number <= 10),
  CONSTRAINT chk_shot_score CHECK (score >= 0 AND score <= 10)
);

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert default admin and sample users
INSERT INTO users (username, password, role, full_name, email, phone, is_active) VALUES 
('admin', 'admin123', 'admin', 'System Administrator', 'admin@shooting.com', '+91-9999999999', TRUE),
('participant1', 'user123', 'participant', 'John Doe', 'john@example.com', '+91-9876543210', TRUE),
('participant2', 'user123', 'participant', 'Jane Smith', 'jane@example.com', '+91-9876543211', TRUE),
('participant3', 'user123', 'participant', 'Mike Johnson', 'mike@example.com', '+91-9876543212', TRUE),
('participant4', 'user123', 'participant', 'Sarah Wilson', 'sarah@example.com', '+91-9876543213', TRUE);

-- Insert sample competitions
INSERT INTO competitions (name, year, description, max_series_count, status, start_date, end_date, created_by) VALUES 
('Annual Shooting Championship 2025', 2025, 'Annual inter-school shooting competition with multiple events', '4', 'active', '2025-01-15', '2025-01-17', 1),
('State Level Competition 2025', 2025, 'State level shooting competition for young athletes', '6', 'upcoming', '2025-02-20', '2025-02-22', 1),
('National Championship 2024', 2024, 'National level shooting championship - completed', '4', 'completed', '2024-12-01', '2024-12-03', 1);

-- Insert sample competition details
INSERT INTO competition_details (competition_id, detail_name, timing_start, timing_end, date, max_lanes, section_type) VALUES 
-- Competition 1 (Annual Championship)
(1, 'Detail 1 - Morning', '09:00:00', '11:00:00', '2025-01-15', 25, 'main'),
(1, 'Detail 2 - Afternoon', '14:00:00', '16:00:00', '2025-01-15', 25, 'main'),
(1, 'Detail 3 - Morning', '09:00:00', '11:00:00', '2025-01-16', 25, 'main'),
(1, 'Detail 4 - Afternoon', '14:00:00', '16:00:00', '2025-01-16', 25, 'main'),
(1, 'Finals', '15:00:00', '17:00:00', '2025-01-17', 10, 'final'),

-- Competition 2 (State Level)
(2, 'Preliminary Round 1', '08:00:00', '10:00:00', '2025-02-20', 30, 'main'),
(2, 'Preliminary Round 2', '11:00:00', '13:00:00', '2025-02-20', 30, 'main'),
(2, 'Semi Finals', '09:00:00', '11:00:00', '2025-02-21', 15, 'main'),
(2, 'Finals', '14:00:00', '16:00:00', '2025-02-22', 8, 'final'),

-- Competition 3 (National Championship - Completed)
(3, 'Qualification Round', '09:00:00', '12:00:00', '2024-12-01', 50, 'main'),
(3, 'Finals', '14:00:00', '17:00:00', '2024-12-02', 8, 'final');

-- Insert sample participants
INSERT INTO participants (user_id, competition_id, student_name, zone, event, school_name, age, age_category, gender, lane_no, detail_id, total_score, ten_pointers, first_series_score, last_series_score) VALUES 
-- Competition 1 participants
(2, 1, 'John Doe', 'North Zone', 'AP', 'Delhi Public School', 16, 'under_17', 'Male', 1, 1, 380, 15, 95, 98),
(3, 1, 'Jane Smith', 'South Zone', 'PS', 'Kendriya Vidyalaya', 15, 'under_17', 'Female', 2, 1, 375, 12, 92, 96),
(4, 1, 'Mike Johnson', 'East Zone', 'OS', 'Army Public School', 17, 'under_19', 'Male', 3, 2, 390, 18, 97, 99),
(5, 1, 'Sarah Wilson', 'West Zone', 'AP', 'DAV Public School', 14, 'under_14', 'Female', 4, 2, 365, 10, 88, 94),

-- Competition 2 participants
(2, 2, 'John Doe', 'North Zone', 'AP', 'Delhi Public School', 16, 'under_17', 'Male', 5, 6, 0, 0, 0, 0),
(3, 2, 'Jane Smith', 'South Zone', 'PS', 'Kendriya Vidyalaya', 15, 'under_17', 'Female', 6, 6, 0, 0, 0, 0);

-- Insert sample series scores for Competition 1
INSERT INTO series_scores (participant_id, series_number, total_score, ten_pointers) VALUES 
-- John Doe's scores
(1, 1, 95, 4),
(1, 2, 92, 3),
(1, 3, 95, 4),
(1, 4, 98, 4),

-- Jane Smith's scores  
(2, 1, 92, 3),
(2, 2, 88, 2),
(2, 3, 95, 4),
(2, 4, 96, 3),

-- Mike Johnson's scores
(3, 1, 97, 5),
(3, 2, 95, 4),
(3, 3, 99, 5),
(3, 4, 99, 4),

-- Sarah Wilson's scores
(4, 1, 88, 2),
(4, 2, 85, 2),
(4, 3, 92, 3),
(4, 4, 94, 3);

-- Insert sample individual shots for first series of each participant
INSERT INTO shots (series_score_id, shot_number, score, is_ten_pointer, ring_value) VALUES 
-- John Doe - Series 1
(1, 1, 10, TRUE, 10.5),
(1, 2, 9, FALSE, 9.8),
(1, 3, 10, TRUE, 10.2),
(1, 4, 9, FALSE, 9.5),
(1, 5, 10, TRUE, 10.8),
(1, 6, 9, FALSE, 9.3),
(1, 7, 10, TRUE, 10.1),
(1, 8, 9, FALSE, 9.7),
(1, 9, 9, FALSE, 9.4),
(1, 10, 10, FALSE, 9.2),

-- Jane Smith - Series 1  
(2, 1, 9, FALSE, 9.6),
(2, 2, 10, TRUE, 10.3),
(2, 3, 9, FALSE, 9.1),
(2, 4, 9, FALSE, 9.8),
(2, 5, 10, TRUE, 10.1),
(2, 6, 9, FALSE, 9.4),
(2, 7, 9, FALSE, 9.7),
(2, 8, 10, TRUE, 10.2),
(2, 9, 9, FALSE, 9.2),
(2, 10, 8, FALSE, 8.9);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- =============================================================================

-- Trigger to update participant total score when series scores change
DELIMITER //
CREATE TRIGGER update_participant_totals
AFTER INSERT ON series_scores
FOR EACH ROW
BEGIN
    UPDATE participants 
    SET 
        total_score = (
            SELECT COALESCE(SUM(total_score), 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id
        ),
        ten_pointers = (
            SELECT COALESCE(SUM(ten_pointers), 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id
        ),
        first_series_score = (
            SELECT COALESCE(total_score, 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id AND series_number = 1
        ),
        last_series_score = (
            SELECT COALESCE(total_score, 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id 
            ORDER BY series_number DESC 
            LIMIT 1
        )
    WHERE id = NEW.participant_id;
END//

-- Trigger to update participant totals when series scores are updated
CREATE TRIGGER update_participant_totals_on_update
AFTER UPDATE ON series_scores
FOR EACH ROW
BEGIN
    UPDATE participants 
    SET 
        total_score = (
            SELECT COALESCE(SUM(total_score), 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id
        ),
        ten_pointers = (
            SELECT COALESCE(SUM(ten_pointers), 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id
        ),
        first_series_score = (
            SELECT COALESCE(total_score, 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id AND series_number = 1
        ),
        last_series_score = (
            SELECT COALESCE(total_score, 0) 
            FROM series_scores 
            WHERE participant_id = NEW.participant_id 
            ORDER BY series_number DESC 
            LIMIT 1
        )
    WHERE id = NEW.participant_id;
END//

-- Trigger to update series score when shots are added
CREATE TRIGGER update_series_totals
AFTER INSERT ON shots
FOR EACH ROW
BEGIN
    UPDATE series_scores 
    SET 
        total_score = (
            SELECT COALESCE(SUM(score), 0) 
            FROM shots 
            WHERE series_score_id = NEW.series_score_id
        ),
        ten_pointers = (
            SELECT COUNT(*) 
            FROM shots 
            WHERE series_score_id = NEW.series_score_id AND is_ten_pointer = TRUE
        )
    WHERE id = NEW.series_score_id;
END//

DELIMITER ;

-- =============================================================================
-- USEFUL VIEWS FOR REPORTING
-- =============================================================================

-- View for participant rankings
CREATE VIEW participant_rankings AS
SELECT 
    p.id,
    p.student_name,
    p.zone,
    p.event,
    p.school_name,
    p.age,
    p.age_category,
    p.gender,
    p.lane_no,
    p.total_score,
    p.ten_pointers,
    p.first_series_score,
    p.last_series_score,
    c.name as competition_name,
    c.year as competition_year,
    cd.detail_name,
    u.full_name as user_name,
    ROW_NUMBER() OVER (
        PARTITION BY p.competition_id, p.event, p.age_category, p.gender 
        ORDER BY p.total_score DESC, p.ten_pointers DESC, p.last_series_score DESC, p.first_series_score DESC
    ) as category_rank,
    ROW_NUMBER() OVER (
        PARTITION BY p.competition_id 
        ORDER BY p.total_score DESC, p.ten_pointers DESC, p.last_series_score DESC, p.first_series_score DESC
    ) as overall_rank
FROM participants p
JOIN competitions c ON p.competition_id = c.id
LEFT JOIN competition_details cd ON p.detail_id = cd.id
JOIN users u ON p.user_id = u.id
WHERE p.total_score > 0;

-- View for competition statistics
CREATE VIEW competition_stats AS
SELECT 
    c.id,
    c.name,
    c.year,
    c.status,
    COUNT(DISTINCT p.id) as total_participants,
    COUNT(DISTINCT CASE WHEN p.event = 'AP' THEN p.id END) as ap_participants,
    COUNT(DISTINCT CASE WHEN p.event = 'PS' THEN p.id END) as ps_participants,
    COUNT(DISTINCT CASE WHEN p.event = 'OS' THEN p.id END) as os_participants,
    COUNT(DISTINCT CASE WHEN p.gender = 'Male' THEN p.id END) as male_participants,
    COUNT(DISTINCT CASE WHEN p.gender = 'Female' THEN p.id END) as female_participants,
    AVG(p.total_score) as average_score,
    MAX(p.total_score) as highest_score,
    COUNT(DISTINCT cd.id) as total_details
FROM competitions c
LEFT JOIN participants p ON c.id = p.competition_id
LEFT JOIN competition_details cd ON c.id = cd.competition_id
GROUP BY c.id, c.name, c.year, c.status;

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_participants_competition_score ON participants(competition_id, total_score DESC);
CREATE INDEX idx_participants_event_category ON participants(event, age_category, gender);
CREATE INDEX idx_series_participant_number ON series_scores(participant_id, series_number);
CREATE INDEX idx_competitions_status_year ON competitions(status, year DESC);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show all created tables
SHOW TABLES;

-- Show table structures
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'shooting_competition'
ORDER BY TABLE_NAME;

-- Show sample data counts
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Competitions', COUNT(*) FROM competitions
UNION ALL  
SELECT 'Competition Details', COUNT(*) FROM competition_details
UNION ALL
SELECT 'Participants', COUNT(*) FROM participants
UNION ALL
SELECT 'Series Scores', COUNT(*) FROM series_scores
UNION ALL
SELECT 'Shots', COUNT(*) FROM shots;

-- Show sample rankings
SELECT 
    student_name,
    event,
    age_category,
    total_score,
    category_rank,
    overall_rank
FROM participant_rankings
WHERE competition_name = 'Annual Shooting Championship 2025'
ORDER BY overall_rank
LIMIT 10;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
SELECT 'Database setup completed successfully!' as status,
       'You can now start your backend server' as next_step;

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================