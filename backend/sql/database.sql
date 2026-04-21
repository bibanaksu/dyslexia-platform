-- =====================================================
-- DYSLEXIA SUPPORT PLATFORM — DATABASE v5.0
-- Clean rebuild — drop and recreate everything.
-- Run: mysql -u root -p dyslexia_db < database.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS dyslexia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dyslexia_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS full_assessment_summary;
DROP TABLE IF EXISTS task4_number_sequence_results;
DROP TABLE IF EXISTS task3_letter_similarity_results;
DROP TABLE IF EXISTS task2_results;
DROP TABLE IF EXISTS task1_word_results;
DROP TABLE IF EXISTS number_sequences;
DROP TABLE IF EXISTS letter_similarity_exercises;
DROP TABLE IF EXISTS reading_words;
DROP TABLE IF EXISTS reading_texts;
DROP TABLE IF EXISTS PasswordResetToken;
DROP TABLE IF EXISTS RefreshToken;
DROP TABLE IF EXISTS TherapistNote;
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS ChildActivityProgress;
DROP TABLE IF EXISTS AssessmentResults;
DROP TABLE IF EXISTS Assessment;
DROP TABLE IF EXISTS ParentScreening;
DROP TABLE IF EXISTS child_info_sessions;
DROP TABLE IF EXISTS Child;
DROP TABLE IF EXISTS Parent;
DROP TABLE IF EXISTS Activity;
DROP TABLE IF EXISTS Therapist;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Therapist
-- =====================================================
CREATE TABLE Therapist (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    login_count   INT          NOT NULL DEFAULT 0,
    last_login    DATETIME     NULL,
    last_ip       VARCHAR(45)  NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Parent
-- =====================================================
CREATE TABLE Parent (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    full_name             VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    phone                 VARCHAR(20)  NULL,
    password_hash         VARCHAR(255) NOT NULL,
    assessment_completed  BOOLEAN      NOT NULL DEFAULT FALSE,
    assessment_date       DATETIME     NULL,
    can_access_activities BOOLEAN      NOT NULL DEFAULT FALSE,
    login_count           INT          NOT NULL DEFAULT 0,
    last_login            DATETIME     NULL,
    last_ip               VARCHAR(45)  NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Child
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
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- child_info_sessions  (one row per assessment session)
-- =====================================================
CREATE TABLE child_info_sessions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(64)  NOT NULL UNIQUE,
    child_name   VARCHAR(255) NOT NULL,
    child_grade  VARCHAR(20)  NOT NULL,
    parent_id    INT          NULL,
    child_id     INT          NULL,
    guest_id     VARCHAR(100) NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id)  ON DELETE SET NULL,
    FOREIGN KEY (child_id)  REFERENCES Child(id)   ON DELETE SET NULL,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_parent_id    (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Activity
-- =====================================================
CREATE TABLE Activity (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    description      TEXT         NULL,
    difficulty_level INT          NOT NULL DEFAULT 1,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Assessment  (links to Child, used by therapist dashboard)
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
    INDEX idx_child_id (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- AssessmentResults  (detailed scores per Assessment)
-- =====================================================
CREATE TABLE AssessmentResults (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id            INT          NOT NULL,
    letter_recognition_score DECIMAL(5,2) NULL,
    word_reading_score       DECIMAL(5,2) NULL,
    comprehension_score      DECIMAL(5,2) NULL,
    overall_evaluation       TEXT         NULL,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES Assessment(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- ChildActivityProgress
-- =====================================================
CREATE TABLE ChildActivityProgress (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    child_id    INT NOT NULL,
    activity_id INT NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    score       INT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)    REFERENCES Child(id)    ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES Activity(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_activity (child_id, activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- AuditLog
-- =====================================================
CREATE TABLE AuditLog (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    user_role  VARCHAR(20)  NOT NULL,
    event_type VARCHAR(50)  NOT NULL,
    ip_address VARCHAR(45)  NULL,
    user_agent TEXT         NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TherapistNote
-- =====================================================
CREATE TABLE TherapistNote (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    therapist_id  INT  NOT NULL,
    note_text     TEXT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (therapist_id) REFERENCES Therapist(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- ParentScreening
-- =====================================================
CREATE TABLE ParentScreening (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    parent_id  INT  NOT NULL,
    answers    JSON NULL,
    score      INT  NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- PasswordResetToken
-- =====================================================
CREATE TABLE PasswordResetToken (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(128)              NOT NULL UNIQUE,
    user_id    INT                       NOT NULL,
    user_role  ENUM('therapist','parent') NOT NULL,
    expires_at DATETIME                  NOT NULL,
    used       BOOLEAN                   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token      (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- RefreshToken
-- =====================================================
CREATE TABLE RefreshToken (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(128)              NOT NULL UNIQUE,
    user_id    INT                       NOT NULL,
    user_role  ENUM('therapist','parent') NOT NULL,
    expires_at DATETIME                  NOT NULL,
    ip_address VARCHAR(45)               NULL,
    user_agent TEXT                      NULL,
    revoked    BOOLEAN                   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token   (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- reading_words  (Task 1 word bank)
-- =====================================================
CREATE TABLE reading_words (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    word_text     VARCHAR(100) NOT NULL,
    category      VARCHAR(50)  NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- reading_texts  (Task 2 passage bank)
-- =====================================================
CREATE TABLE reading_texts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    word_count INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- task1_word_results  (Word Explorer)
-- UNIQUE on session_uuid → ON DUPLICATE KEY UPDATE works
-- =====================================================
CREATE TABLE task1_word_results (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid            VARCHAR(64)   NULL,
    child_id                INT           NULL,
    parent_id               INT           NULL,
    child_name              VARCHAR(255)  NOT NULL DEFAULT 'Guest User',
    child_grade             VARCHAR(20)   NOT NULL DEFAULT 'Not Specified',
    similar_words_score     INT           NOT NULL DEFAULT 0,
    non_similar_words_score INT           NOT NULL DEFAULT 0,
    pseudo_words_score      INT           NOT NULL DEFAULT 0,
    total_score             INT           NOT NULL DEFAULT 0,
    total_words             INT           NOT NULL DEFAULT 60,
    percentage              DECIMAL(5,2)  NOT NULL DEFAULT 0,
    performance_level       VARCHAR(50)   NULL,
    total_time_seconds      INT           NOT NULL DEFAULT 0,
    avg_time_per_word       DECIMAL(6,2)  NOT NULL DEFAULT 0,
    error_patterns          JSON          NULL,
    is_partial              TINYINT(1)    NOT NULL DEFAULT 0,
    completed_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    UNIQUE KEY uq_session_uuid (session_uuid),
    INDEX idx_child_id   (child_id),
    INDEX idx_parent_id  (parent_id),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- task2_results  (Story Reader — voice reading)
-- =====================================================
CREATE TABLE task2_results (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid      VARCHAR(64)   NULL,
    child_id          INT           NULL,
    parent_id         INT           NULL,
    child_name        VARCHAR(255)  NOT NULL DEFAULT 'Guest User',
    child_grade       VARCHAR(20)   NOT NULL DEFAULT 'Not Specified',
    passage_title     VARCHAR(255)  NOT NULL DEFAULT 'The Teacher',
    total_words       INT           NOT NULL DEFAULT 0,
    correct_words     INT           NOT NULL DEFAULT 0,
    error_count       INT           NOT NULL DEFAULT 0,
    percentage        DECIMAL(5,2)  NOT NULL DEFAULT 0,
    fluency_level     VARCHAR(50)   NULL,
    reading_speed_wpm INT           NOT NULL DEFAULT 0,
    time_used_seconds INT           NOT NULL DEFAULT 0,
    max_time_seconds  INT           NOT NULL DEFAULT 180,
    finished_early    TINYINT(1)    NOT NULL DEFAULT 0,
    error_details     JSON          NULL,
    is_partial        TINYINT(1)    NOT NULL DEFAULT 0,
    completed_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    UNIQUE KEY uq_session_uuid (session_uuid),
    INDEX idx_child_id    (child_id),
    INDEX idx_parent_id   (parent_id),
    INDEX idx_fluency     (fluency_level),
    INDEX idx_percentage  (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- letter_similarity_exercises  (Task 3 exercise bank)
-- =====================================================
CREATE TABLE letter_similarity_exercises (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    exercise_number INT          NOT NULL,
    group1          VARCHAR(50)  NOT NULL,
    group2          VARCHAR(50)  NOT NULL,
    is_same         BOOLEAN      NOT NULL,
    display_order   INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- task3_letter_similarity_results  (Letter Detective)
-- =====================================================
CREATE TABLE task3_letter_similarity_results (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid          VARCHAR(64)   NULL,
    child_id              INT           NULL,
    parent_id             INT           NULL,
    child_name            VARCHAR(255)  NOT NULL DEFAULT 'Guest User',
    child_grade           VARCHAR(20)   NOT NULL DEFAULT 'Not Specified',
    total_exercises       INT           NOT NULL DEFAULT 20,
    correct_count         INT           NOT NULL DEFAULT 0,
    incorrect_count       INT           NOT NULL DEFAULT 0,
    timeout_count         INT           NOT NULL DEFAULT 0,
    percentage            DECIMAL(5,2)  NOT NULL DEFAULT 0,
    performance_level     VARCHAR(50)   NULL,
    total_time_seconds    INT           NOT NULL DEFAULT 0,
    avg_time_per_exercise DECIMAL(6,2)  NOT NULL DEFAULT 0,
    exercise_details      JSON          NULL,
    is_partial            TINYINT(1)    NOT NULL DEFAULT 0,
    completed_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    UNIQUE KEY uq_session_uuid (session_uuid),
    INDEX idx_child_id   (child_id),
    INDEX idx_parent_id  (parent_id),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- number_sequences  (Task 4 sequence bank)
-- =====================================================
CREATE TABLE number_sequences (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    sequence_number       INT          NOT NULL,
    numbers               JSON         NOT NULL,
    length                INT          NOT NULL,
    response_time_seconds INT          NOT NULL,
    display_order         INT          NOT NULL DEFAULT 0,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- task4_number_sequence_results  (Number Memory)
-- =====================================================
CREATE TABLE task4_number_sequence_results (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid       VARCHAR(64)   NULL,
    child_id           INT           NULL,
    parent_id          INT           NULL,
    guest_id           VARCHAR(100)  NULL,
    child_name         VARCHAR(255)  NOT NULL DEFAULT 'Guest User',
    child_grade        VARCHAR(20)   NOT NULL DEFAULT 'Not Specified',
    total_possible     INT           NOT NULL DEFAULT 20,
    completed_items    INT           NOT NULL DEFAULT 0,
    correct_count      INT           NOT NULL DEFAULT 0,
    incorrect_count    INT           NOT NULL DEFAULT 0,
    timeout_count      INT           NOT NULL DEFAULT 0,
    percentage         DECIMAL(5,2)  NOT NULL DEFAULT 0,
    performance_level  VARCHAR(50)   NULL,
    total_time_seconds INT           NOT NULL DEFAULT 0,
    avg_time_per_item  DECIMAL(6,2)  NOT NULL DEFAULT 0,
    sequence_details   JSON          NULL,
    is_partial         TINYINT(1)    NOT NULL DEFAULT 0,
    completed_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    UNIQUE KEY uq_session_uuid (session_uuid),
    INDEX idx_child_id   (child_id),
    INDEX idx_parent_id  (parent_id),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- full_assessment_summary  (combined results per session)
-- =====================================================
CREATE TABLE full_assessment_summary (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid  VARCHAR(64)   NOT NULL UNIQUE,
    child_name    VARCHAR(255)  NOT NULL,
    child_grade   VARCHAR(20)   NOT NULL,
    parent_id     INT           NULL,
    child_id      INT           NULL,
    task1_score   DECIMAL(5,2)  NULL COMMENT 'Word Explorer %',
    task2_score   DECIMAL(5,2)  NULL COMMENT 'Story Reader %',
    task3_score   DECIMAL(5,2)  NULL COMMENT 'Letter Detective %',
    task4_score   DECIMAL(5,2)  NULL COMMENT 'Number Memory %',
    overall_score DECIMAL(5,2)  NULL,
    risk_level    VARCHAR(50)   NULL COMMENT 'Low Risk | Moderate Risk | High Risk',
    completed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    INDEX idx_parent_id  (parent_id),
    INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SEED DATA
-- =====================================================
INSERT INTO Therapist (username, email, password_hash) VALUES
('therapist', 'therapist@dyslexiaplatform.com', '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi');

INSERT INTO Parent (full_name, email, phone, password_hash) VALUES
('John Smith',   'john.smith@example.com',  '555-0101', '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi'),
('Mary Johnson', 'mary.johnson@example.com','555-0102', '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi');

INSERT INTO Child (full_name, grade, parent_id, dob) VALUES
('Emma Smith',     3, 1, DATE_SUB(CURDATE(), INTERVAL  8 YEAR)),
('Liam Smith',     5, 1, DATE_SUB(CURDATE(), INTERVAL 10 YEAR)),
('Sophie Johnson', 2, 2, DATE_SUB(CURDATE(), INTERVAL  7 YEAR));

INSERT INTO Activity (name, description, difficulty_level) VALUES
('Letter Recognition Basics', 'Learn to recognize basic alphabet letters', 1),
('Phonics Practice',          'Practice phonetic sounds and patterns',     2),
('Word Building',             'Build simple words from letter blocks',      2),
('Reading Comprehension',     'Read passages and answer questions',         3),
('Speed Reading Exercise',    'Improve reading speed with timed exercises', 3);

INSERT INTO TherapistNote (therapist_id, note_text) VALUES
(1, 'Follow up with parents regarding the updated intervention plan.'),
(1, 'Prepare assessment materials for mid-term review.');

INSERT INTO reading_words (word_text, category, display_order) VALUES
('cat','similar',1),('bat','similar',2),('hat','similar',3),('mat','similar',4),
('cap','similar',5),('cup','similar',6),('map','similar',7),('mop','similar',8),
('pin','similar',9),('pen','similar',10),('sit','similar',11),('set','similar',12),
('bad','similar',13),('bed','similar',14),('big','similar',15),('pig','similar',16),
('fan','similar',17),('van','similar',18),('tap','similar',19),('top','similar',20),
('house','non_similar',1),('tree','non_similar',2),('school','non_similar',3),
('water','non_similar',4),('mother','non_similar',5),('father','non_similar',6),
('child','non_similar',7),('book','non_similar',8),('table','non_similar',9),
('chair','non_similar',10),('apple','non_similar',11),('bread','non_similar',12),
('car','non_similar',13),('road','non_similar',14),('sun','non_similar',15),
('moon','non_similar',16),('dog','non_similar',17),('friend','non_similar',18),
('teacher','non_similar',19),('garden','non_similar',20),
('mip','pseudo',1),('lat','pseudo',2),('nob','pseudo',3),('kep','pseudo',4),
('sud','pseudo',5),('fik','pseudo',6),('zan','pseudo',7),('pel','pseudo',8),
('mot','pseudo',9),('rib','pseudo',10),('dak','pseudo',11),('vun','pseudo',12),
('sep','pseudo',13),('gol','pseudo',14),('tim','pseudo',15),('paf','pseudo',16),
('lod','pseudo',17),('kes','pseudo',18),('bim','pseudo',19),('ran','pseudo',20);

INSERT INTO reading_texts (title, content, word_count) VALUES (
  'The Teacher',
  'While the children were sitting around their father, talking together, one of them asked: "Is there any similarity between you and the teacher, Father?" The father replied, "Yes." "The teacher, my son, takes care of your mind and dedicates his life to educating and guiding you. A polite student obeys teachers just as he obeys his parents and respects them. All teachers make great efforts to raise and educate students. Therefore, students should listen to their advice and recognize the teacher\'s value, just as they recognize the value of their parents." Then the father turned to his children and said, "Do not neglect your duties. Be kind to those who are kind to you. Work hard for your future and for the service of your country."',
  85
);

INSERT INTO letter_similarity_exercises (exercise_number, group1, group2, is_same, display_order) VALUES
(1,'T Z R','T Z R',TRUE,1),(2,'B L N','B L N',TRUE,2),(3,'S D Z','Z D S',FALSE,3),
(4,'F Q R S','SH S Q F',FALSE,4),(5,'F Q','F Q',TRUE,5),(6,'B Y T','B Y T',TRUE,6),
(7,'A B M Y','A B M A',FALSE,7),(8,'H KH J','H KH J',TRUE,8),
(9,'Y R W','Y S J D',FALSE,9),(10,'D D D D','D D D D',TRUE,10),
(11,'A GH F','A GH F',TRUE,11),(12,'Q S S','Q S S',TRUE,12),
(13,'W Z R','R R Z W',FALSE,13),(14,'TH DH H','TH DH H',TRUE,14),
(15,'S SH S Z','S SH S Z',TRUE,15),(16,'A L SH J R T','A L SH J R T',TRUE,16),
(17,'TH F Q KH','Q F TH KH',FALSE,17),(18,'Y I L A','I Y L A',FALSE,18),
(19,'T TH B','T TH B',TRUE,19),(20,'P R B','P R B',TRUE,20);

INSERT INTO number_sequences (sequence_number, numbers, length, response_time_seconds, display_order) VALUES
(1,'[4,7]',2,10,1),(2,'[3,8,1]',3,15,2),(3,'[6,2,9,5]',4,20,3),
(4,'[1,4,7,2,8]',5,25,4),(5,'[5,0,9,3,6,1]',6,30,5),
(6,'[2,6,4,8,0,7,3]',7,35,6),(7,'[9,2]',2,10,7),
(8,'[1,5,3]',3,15,8),(9,'[7,0,6,2,4]',5,25,9),
(10,'[8,3,1,9,5,2]',6,30,10);

SELECT '✅ Database v5.0 complete!' AS status;