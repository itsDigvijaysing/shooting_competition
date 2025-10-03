-- Quick fix for login issues
-- Run this in your MySQL database to ensure proper user data

-- First check if users exist
SELECT * FROM users;

-- If no users exist or you want to reset, run these:
DELETE FROM users;

-- Insert users with plain text passwords for demo
INSERT INTO users (username, password, role, full_name, email, is_active) VALUES 
('admin', 'admin123', 'admin', 'System Administrator', 'admin@shooting.com', TRUE),
('participant1', 'user123', 'participant', 'John Doe', 'john@example.com', TRUE),
('participant2', 'user123', 'participant', 'Jane Smith', 'jane@example.com', TRUE);

-- Verify users were created
SELECT id, username, role, full_name, is_active FROM users;

-- Also ensure we have a competition for the frontend to load
SELECT * FROM competitions;

-- If no competitions exist, create one:
INSERT INTO competitions (name, year, description, max_series_count, status, created_by) VALUES 
('National Shooting Championship 2025', 2025, 'Annual national level shooting competition', 4, 'active', 1);

SELECT * FROM competitions;