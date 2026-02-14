-- Dyslexia Support Platform Database Schema
-- This SQL file creates all necessary tables for the platform

USE dyslexia_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS ChildActivityProgress;
DROP TABLE IF EXISTS AssessmentResults;
DROP TABLE IF EXISTS Assessment;
DROP TABLE IF EXISTS Activity;
DROP TABLE IF EXISTS Child;
DROP TABLE IF EXISTS Parent;
DROP TABLE IF EXISTS Therapist;

-- Therapist Table (one therapist)
CREATE TABLE Therapist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Parent Table
CREATE TABLE Parent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Child Table
CREATE TABLE Child (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    grade INT NOT NULL,
    parent_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id),
    INDEX idx_grade (grade)
);

-- Activity Table
CREATE TABLE Activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty_level (difficulty_level)
);

-- Assessment Table
CREATE TABLE Assessment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    assessment_date DATETIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES Child(id) ON DELETE CASCADE,
    INDEX idx_child_id (child_id),
    INDEX idx_assessment_date (assessment_date)
);

-- AssessmentResults Table
CREATE TABLE AssessmentResults (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    letter_recognition_score DECIMAL(5, 2),
    word_reading_score DECIMAL(5, 2),
    comprehension_score DECIMAL(5, 2),
    overall_evaluation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES Assessment(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assessment (assessment_id),
    INDEX idx_assessment_id (assessment_id)
);

-- ChildActivityProgress Table
CREATE TABLE ChildActivityProgress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    activity_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completion_date DATETIME,
    progress_percentage INT DEFAULT 0,
    last_accessed DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES Child(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES Activity(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_activity (child_id, activity_id),
    INDEX idx_child_id (child_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_completed (completed)
);

-- Insert sample data
INSERT INTO Therapist (full_name, email, phone) VALUES 
('Dr. Sarah Johnson', 'therapist@dyslexia-platform.com', '555-0100');

INSERT INTO Parent (full_name, email, phone, password_hash) VALUES 
('John Smith', 'john.smith@example.com', '555-0101', 'hashed_password_1'),
('Mary Johnson', 'mary.johnson@example.com', '555-0102', 'hashed_password_2');

INSERT INTO Child (full_name, grade, parent_id) VALUES 
('Emma Smith', 3, 1),
('Liam Smith', 5, 1),
('Sophie Johnson', 2, 2);

INSERT INTO Activity (name, description, difficulty_level) VALUES 
('Letter Recognition Basics', 'Learn to recognize basic alphabet letters', 1),
('Word Building', 'Build simple words from letter blocks', 2),
('Reading Comprehension', 'Read passages and answer questions', 3),
('Phonics Practice', 'Practice phonetic sounds and patterns', 2),
('Speed Reading Exercise', 'Improve reading speed with timed exercises', 3);

-- Create indexes for better query performance
CREATE INDEX idx_parent_email ON Parent(email);
CREATE INDEX idx_child_parent ON Child(parent_id);
CREATE INDEX idx_assessment_child_date ON Assessment(child_id, assessment_date);
CREATE INDEX idx_progress_child_activity ON ChildActivityProgress(child_id, activity_id);
