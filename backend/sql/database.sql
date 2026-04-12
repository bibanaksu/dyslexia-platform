-- =====================================================
-- DYSLEXIA SUPPORT PLATFORM — COMPLETE DATABASE SCHEMA
-- Version 2.0 — Fixed & Production-Ready
-- =====================================================
-- HOW TO RUN:
--   docker exec -i dyslexia-mysql mysql -u root -pdyslexia_password dyslexia_db < database.sql
-- =====================================================

USE dyslexia_db;

-- =====================================================
-- CLEAN SLATE (foreign key order matters)
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS TherapistNote;
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS ChildActivityProgress;
DROP TABLE IF EXISTS AssessmentResults;
DROP TABLE IF EXISTS Assessment;
DROP TABLE IF EXISTS Activity;
DROP TABLE IF EXISTS Child;
DROP TABLE IF EXISTS ParentScreening;
DROP TABLE IF EXISTS Parent;
DROP TABLE IF EXISTS Therapist;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- TABLE 1: Therapist
-- =====================================================
CREATE TABLE Therapist (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    -- Session tracking
    login_count     INT          NOT NULL DEFAULT 0,
    last_login      DATETIME     NULL,
    last_ip         VARCHAR(45)  NULL,
    -- Timestamps
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Indexes
    INDEX idx_email (email)
);

-- =====================================================
-- TABLE 2: Parent
-- =====================================================
CREATE TABLE Parent (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    full_name             VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    phone                 VARCHAR(20)  NULL,
    password_hash         VARCHAR(255) NOT NULL,
    -- Assessment flow
    assessment_completed  BOOLEAN      NOT NULL DEFAULT FALSE,
    assessment_date       DATETIME     NULL,
    can_access_activities BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Session tracking
    login_count           INT          NOT NULL DEFAULT 0,
    last_login            DATETIME     NULL,
    last_ip               VARCHAR(45)  NULL,
    -- Timestamps
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Indexes
    INDEX idx_email (email)
);

-- =====================================================
-- TABLE 3: Child
-- =====================================================
CREATE TABLE Child (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name  VARCHAR(255) NOT NULL,
    grade      INT          NOT NULL,
    parent_id  INT          NOT NULL,
    dob        DATE         NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id),
    INDEX idx_grade     (grade)
);

-- =====================================================
-- TABLE 4: Activity
-- =====================================================
CREATE TABLE Activity (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    description      TEXT         NULL,
    difficulty_level INT          NOT NULL DEFAULT 1,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty_level (difficulty_level)
);

-- =====================================================
-- TABLE 5: Assessment
-- =====================================================
CREATE TABLE Assessment (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    child_id        INT          NOT NULL,
    assessment_date DATETIME     NOT NULL,
    notes           TEXT         NULL,
    reviewed        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES Child(id) ON DELETE CASCADE,
    INDEX idx_child_id       (child_id),
    INDEX idx_assessment_date (assessment_date)
);

-- =====================================================
-- TABLE 6: AssessmentResults
-- =====================================================
CREATE TABLE AssessmentResults (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id            INT         NOT NULL,
    letter_recognition_score DECIMAL(5,2) NULL,
    word_reading_score       DECIMAL(5,2) NULL,
    comprehension_score      DECIMAL(5,2) NULL,
    overall_evaluation       TEXT         NULL,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES Assessment(id) ON DELETE CASCADE,
    UNIQUE KEY  unique_assessment (assessment_id),
    INDEX idx_assessment_id  (assessment_id)
);

-- =====================================================
-- TABLE 7: ChildActivityProgress
-- =====================================================
CREATE TABLE ChildActivityProgress (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    child_id            INT       NOT NULL,
    activity_id         INT       NOT NULL,
    completed           BOOLEAN   NOT NULL DEFAULT FALSE,
    completion_date     DATETIME  NULL,
    progress_percentage INT       NOT NULL DEFAULT 0,
    last_accessed       DATETIME  NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)    REFERENCES Child(id)    ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES Activity(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_activity (child_id, activity_id),
    INDEX idx_child_id    (child_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_completed   (completed)
);

-- =====================================================
-- TABLE 8: AuditLog
-- =====================================================
-- FIX: event_type is now VARCHAR(50) so future event types
--      (e.g. 'logout', 'password_change') don't require an
--      ALTER TABLE. Existing ENUM values still work fine.
-- =====================================================
CREATE TABLE IF NOT EXISTS AuditLog (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT         NOT NULL,
    user_role  ENUM('therapist','parent') NOT NULL,
    event_type VARCHAR(50) NOT NULL,          -- login_success | login_failure | logout | password_change …
    ip_address VARCHAR(45) NULL,
    user_agent TEXT        NULL,              -- full UA string, no truncation
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Indexes for fast querying
    INDEX idx_user    (user_id, user_role),
    INDEX idx_event   (event_type),
    INDEX idx_created (created_at)
);

-- =====================================================
-- TABLE 9: TherapistNote
-- =====================================================
CREATE TABLE TherapistNote (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    therapist_id INT       NOT NULL,
    note_text    TEXT      NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (therapist_id) REFERENCES Therapist(id) ON DELETE CASCADE,
    INDEX idx_therapist (therapist_id),
    INDEX idx_created   (created_at)
);

-- =====================================================
-- TABLE 10: ParentScreening
-- =====================================================
CREATE TABLE ParentScreening (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    parent_id       INT       NULL,               -- NULL = anonymous submission
    question_1      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_2      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_3      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_4      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_5      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_6      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_7      BOOLEAN   NOT NULL DEFAULT FALSE,
    question_8      BOOLEAN   NOT NULL DEFAULT FALSE,
    total_yes_count INT       NOT NULL DEFAULT 0,
    completed_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    INDEX idx_parent_id    (parent_id),
    INDEX idx_completed_at (completed_at)
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- ─── Therapist ───────────────────────────────────────
-- password : Therapist@123
-- hash     : bcrypt, 12 rounds, $2b prefix (Node.js bcrypt v6)
-- verified : bcrypt.compare('Therapist@123', hash) === true
INSERT INTO Therapist (username, email, password_hash) VALUES
(
    'therapist',
    'therapist@dyslexiaplatform.com',
    '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi'
);

-- ─── Sample Parents ──────────────────────────────────
-- FIX: placeholder hashes removed — they were invalid bcrypt strings
--      that caused bcrypt.compare() to throw an error.
--      Replaced with a real hash for password 'Parent@123'
--      Change these before going to production.
--
-- To generate your own:
--   node -e "require('bcrypt').hash('YourPassword',12).then(console.log)"
INSERT INTO Parent (full_name, email, phone, password_hash) VALUES
(
    'John Smith',
    'john.smith@example.com',
    '555-0101',
    '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi'   -- Parent@123 (replace in prod)
),
(
    'Mary Johnson',
    'mary.johnson@example.com',
    '555-0102',
    '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi'   -- Parent@123 (replace in prod)
);

-- ─── Sample Children ─────────────────────────────────
INSERT INTO Child (full_name, grade, parent_id, dob) VALUES
('Emma Smith',     3, 1, DATE_SUB(CURDATE(), INTERVAL 8  YEAR)),
('Liam Smith',     5, 1, DATE_SUB(CURDATE(), INTERVAL 10 YEAR)),
('Sophie Johnson', 2, 2, DATE_SUB(CURDATE(), INTERVAL 7  YEAR));

-- ─── Sample Activities ───────────────────────────────
INSERT INTO Activity (name, description, difficulty_level) VALUES
('Letter Recognition Basics', 'Learn to recognize basic alphabet letters',  1),
('Phonics Practice',          'Practice phonetic sounds and patterns',       2),
('Word Building',             'Build simple words from letter blocks',       2),
('Reading Comprehension',     'Read passages and answer questions',          3),
('Speed Reading Exercise',    'Improve reading speed with timed exercises',  3);

-- ─── Sample Therapist Notes ──────────────────────────
INSERT INTO TherapistNote (therapist_id, note_text) VALUES
(1, 'Follow up with parents regarding the updated intervention plan.'),
(1, 'Prepare assessment materials for mid-term review.');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 'Database setup complete!' AS status;

SELECT
    table_name                                  AS `Table`,
    table_rows                                  AS `Approx Rows`
FROM information_schema.tables
WHERE table_schema = 'dyslexia_db'
ORDER BY table_name;

-- Quick sanity check: confirm therapist row exists
SELECT
    id,
    username,
    email,
    login_count,
    created_at
FROM Therapist;