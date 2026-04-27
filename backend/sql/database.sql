-- ================================================================
--  DYSLEXIA PLATFORM — FINAL CLEAN DATABASE
--  Built: 2026-04-26
--
--  ARCHITECTURE DECISION (read this first):
--
--  The single linking key is child_id.
--  Every piece of data — quiz, tasks, results, messages —
--  belongs to a child. A child always belongs to one parent.
--  So to get everything for a parent, you just do:
--    SELECT * FROM child WHERE parent_id = ?
--  and from child_id you can reach every other table.
--
--  HOW GUEST → ACCOUNT WORKS:
--  1. Guest starts assessment → backend creates a temporary
--     row in `child_session` (NOT in child table yet).
--     Returns child_session.id (integer) to the frontend.
--     Frontend stores this integer id in localStorage.
--  2. All 4 task tables use child_session_id as their FK.
--  3. At the end, parent is shown results and invited to register.
--  4. Parent registers → backend does:
--       INSERT INTO parent (...) → parent_id
--       INSERT INTO child (name, grade, parent_id) → child_id
--       UPDATE child_session SET child_id=?, parent_id=? WHERE id=?
--       UPDATE task1..4 SET child_id=? WHERE child_session_id=?
--       UPDATE full_assessment_summary SET child_id=?, parent_id=? WHERE child_session_id=?
--       UPDATE parent_screening SET child_id=?, parent_id=? WHERE child_session_id=?
--  5. Second child of same parent → new child_session, new child row,
--     same parent_id. Parent logs in once and sees all children.
--
--  WHAT WAS REMOVED vs original:
--    - parentscreening         (duplicate of parent_screening)
--    - letter_similarity       (duplicate of letter_similarity_exercises)
--    - child_name/child_grade from task tables (redundant — join child_session)
--    - guest_id column         (replaced by child_session_id integer)
--    - session_uuid string     (replaced by child_session.id integer)
--    - parent.assessment_completed / assessment_date (computed, not stored)
--    - parent.can_access_activities (computed from assessment status)
--    - is_partial column in task tables (rarely used, removed)
--    - assessment + assessmentresults (merged into full_assessment_summary)
-- ================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
START TRANSACTION;

-- ================================================================
--  DROP ALL TABLES (clean slate)
-- ================================================================
DROP TABLE IF EXISTS `therapistnote`;
DROP TABLE IF EXISTS `message`;
DROP TABLE IF EXISTS `childactivityprogress`;
DROP TABLE IF EXISTS `task4_number_reversal_results`;
DROP TABLE IF EXISTS `task4_number_sequence_results`;
DROP TABLE IF EXISTS `task3_letter_similarity_results`;
DROP TABLE IF EXISTS `task2_results`;
DROP TABLE IF EXISTS `task1_word_results`;
DROP TABLE IF EXISTS `full_assessment_summary`;
DROP TABLE IF EXISTS `parent_screening`;
DROP TABLE IF EXISTS `parentscreening`;
DROP TABLE IF EXISTS `child_info_sessions`;
DROP TABLE IF EXISTS `child_session`;
DROP TABLE IF EXISTS `assessment`;
DROP TABLE IF EXISTS `assessmentresults`;
DROP TABLE IF EXISTS `childactivityprogress`;
DROP TABLE IF EXISTS `child`;
DROP TABLE IF EXISTS `parent`;
DROP TABLE IF EXISTS `therapist`;
DROP TABLE IF EXISTS `activity`;
DROP TABLE IF EXISTS `reading_words`;
DROP TABLE IF EXISTS `reading_texts`;
DROP TABLE IF EXISTS `letter_similarity`;
DROP TABLE IF EXISTS `letter_similarity_exercises`;
DROP TABLE IF EXISTS `number_sequences`;
DROP TABLE IF EXISTS `refreshtoken`;
DROP TABLE IF EXISTS `passwordresettoken`;
DROP TABLE IF EXISTS `auditlog`;

-- ================================================================
--  1. THERAPIST
--  One therapist account (or more). Manages the platform.
-- ================================================================
CREATE TABLE `therapist` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)  NOT NULL,
  `email`         VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `login_count`   INT          NOT NULL DEFAULT 0,
  `last_login`    DATETIME     DEFAULT NULL,
  `last_ip`       VARCHAR(45)  DEFAULT NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  2. PARENT
--  One row per real parent/guardian person.
--  One email = one parent account.
--  A parent can have multiple children (separate child rows).
-- ================================================================
CREATE TABLE `parent` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `full_name`             VARCHAR(255) NOT NULL,
  `email`                 VARCHAR(255) NOT NULL,
  `phone`                 VARCHAR(20)  DEFAULT NULL,
  `password_hash`         VARCHAR(255) NOT NULL,
  `assigned_therapist_id` INT          DEFAULT NULL,
  `login_count`           INT          NOT NULL DEFAULT 0,
  `last_login`            DATETIME     DEFAULT NULL,
  `last_ip`               VARCHAR(45)  DEFAULT NULL,
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `fk_parent_therapist` (`assigned_therapist_id`),
  CONSTRAINT `fk_parent_therapist`
    FOREIGN KEY (`assigned_therapist_id`) REFERENCES `therapist` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  3. CHILD
--  One row per child. Linked to parent AFTER registration.
--  Created when parent registers and claims an assessment session.
--  parent_id is NOT NULL — a child in this table always has a parent.
--  (Unregistered children live in child_session only.)
-- ================================================================
CREATE TABLE `child` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `parent_id`  INT          NOT NULL,
  `full_name`  VARCHAR(255) NOT NULL,
  `grade`      INT          NOT NULL,
  `dob`        DATE         DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_child_parent` (`parent_id`),
  CONSTRAINT `fk_child_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  4. CHILD_SESSION  ★ THE CENTRAL LINKING TABLE ★
--
--  Created the moment a user (guest or logged-in) starts an
--  assessment by entering the child's name and grade.
--  Returns an INTEGER id to the frontend — stored in localStorage.
--  This integer id is what links ALL task results together.
--
--  BEFORE registration:  child_id = NULL, parent_id = NULL
--  AFTER registration:   child_id = X,    parent_id = Y
--
--  This is the ONLY table that stores child_name and child_grade
--  for the session. All task tables reference this via FK.
--  No need to store child_name in every task table.
-- ================================================================
CREATE TABLE `child_session` (
  `id`          INT          NOT NULL AUTO_INCREMENT,  -- ← THE integer linking id
  `child_name`  VARCHAR(255) NOT NULL,
  `child_grade` INT          NOT NULL,
  `parent_id`   INT          DEFAULT NULL,             -- NULL until account linked
  `child_id`    INT          DEFAULT NULL,             -- NULL until child profile created
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cs_parent` (`parent_id`),
  KEY `fk_cs_child` (`child_id`),
  CONSTRAINT `fk_cs_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_cs_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  5. PARENT_SCREENING
--  Optional quiz the parent fills before the child's assessment.
--  Linked to the session by child_session_id.
--  parent_id and child_id filled in after registration.
-- ================================================================
CREATE TABLE `parent_screening` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `child_session_id` INT          NOT NULL,             -- ← links to child_session.id
  `parent_id`        INT          DEFAULT NULL,
  `child_id`         INT          DEFAULT NULL,
  `answers`          JSON         NOT NULL,
  `total_yes_count`  INT          NOT NULL DEFAULT 0,
  `risk_level`       VARCHAR(20)  NOT NULL,
  `risk_score`       DECIMAL(5,2) NOT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),  -- one quiz per session
  KEY `fk_ps_parent` (`parent_id`),
  KEY `fk_ps_child` (`child_id`),
  CONSTRAINT `fk_ps_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_ps_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_ps_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  6. TASK 1 — Word Reading
--  child_name and child_grade REMOVED — get them from child_session.
--  child_session_id is the only key needed to link everything.
-- ================================================================
CREATE TABLE `task1_word_results` (
  `id`                      INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`        INT          NOT NULL,
  `child_id`                INT          DEFAULT NULL,   -- filled after registration
  `similar_words_score`     INT          NOT NULL DEFAULT 0,
  `non_similar_words_score` INT          NOT NULL DEFAULT 0,
  `pseudo_words_score`      INT          NOT NULL DEFAULT 0,
  `total_score`             INT          NOT NULL DEFAULT 0,
  `total_words`             INT          NOT NULL DEFAULT 60,
  `percentage`              DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `performance_level`       VARCHAR(50)  DEFAULT NULL,
  `total_time_seconds`      INT          NOT NULL DEFAULT 0,
  `avg_time_per_word`       DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `error_patterns`          JSON         DEFAULT NULL,
  `completed_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),   -- one result per session
  KEY `fk_t1_child` (`child_id`),
  CONSTRAINT `fk_t1_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_t1_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  7. TASK 2 — Reading Comprehension / Story Reader
-- ================================================================
CREATE TABLE `task2_results` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`   INT          NOT NULL,
  `child_id`           INT          DEFAULT NULL,
  `total_words`        INT          NOT NULL DEFAULT 0,
  `correct_count`      INT          NOT NULL DEFAULT 0,
  `incorrect_count`    INT          NOT NULL DEFAULT 0,
  `timeout_count`      INT          NOT NULL DEFAULT 0,
  `percentage`         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `performance_level`  VARCHAR(50)  DEFAULT NULL,
  `total_time_seconds` INT          NOT NULL DEFAULT 0,
  `avg_time_per_word`  DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `word_details`       JSON         DEFAULT NULL,
  `completed_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t2_child` (`child_id`),
  CONSTRAINT `fk_t2_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_t2_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  8. TASK 3 — Letter Similarity / Letter Detective
-- ================================================================
CREATE TABLE `task3_letter_similarity_results` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`      INT          NOT NULL,
  `child_id`              INT          DEFAULT NULL,
  `total_comparisons`     INT          NOT NULL DEFAULT 20,
  `correct_count`         INT          NOT NULL DEFAULT 0,
  `incorrect_count`       INT          NOT NULL DEFAULT 0,
  `timeout_count`         INT          NOT NULL DEFAULT 0,
  `percentage`            DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `performance_level`     VARCHAR(50)  DEFAULT NULL,
  `total_time_seconds`    INT          NOT NULL DEFAULT 0,
  `avg_time_per_item`     DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `comparison_details`    JSON         DEFAULT NULL,
  `completed_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t3_child` (`child_id`),
  CONSTRAINT `fk_t3_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_t3_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  9. TASK 4 — Number Memory (sequence + reversal combined)
--  Previously split into two tables. Merged into one because
--  they belong to the same task and same session.
-- ================================================================
CREATE TABLE `task4_number_memory_results` (
  `id`                      INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`        INT          NOT NULL,
  `child_id`                INT          DEFAULT NULL,
  -- Sequence sub-task
  `seq_total`               INT          NOT NULL DEFAULT 20,
  `seq_correct`             INT          NOT NULL DEFAULT 0,
  `seq_incorrect`           INT          NOT NULL DEFAULT 0,
  `seq_timeout`             INT          NOT NULL DEFAULT 0,
  `seq_percentage`          DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `seq_time_seconds`        INT          NOT NULL DEFAULT 0,
  `seq_details`             JSON         DEFAULT NULL,
  -- Reversal sub-task
  `rev_total`               INT          NOT NULL DEFAULT 10,
  `rev_correct`             INT          NOT NULL DEFAULT 0,
  `rev_incorrect`           INT          NOT NULL DEFAULT 0,
  `rev_timeout`             INT          NOT NULL DEFAULT 0,
  `rev_percentage`          DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `rev_time_seconds`        INT          NOT NULL DEFAULT 0,
  `rev_details`             JSON         DEFAULT NULL,
  -- Combined
  `overall_percentage`      DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `performance_level`       VARCHAR(50)  DEFAULT NULL,
  `completed_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t4_child` (`child_id`),
  CONSTRAINT `fk_t4_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_t4_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  10. FULL ASSESSMENT SUMMARY
--  Computed once all 4 tasks are done.
--  Single row per session. Parent and child IDs filled after signup.
-- ================================================================
CREATE TABLE `full_assessment_summary` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `child_session_id` INT          NOT NULL,
  `child_id`         INT          DEFAULT NULL,   -- filled after registration
  `parent_id`        INT          DEFAULT NULL,   -- filled after registration
  `task1_score`      DECIMAL(5,2) DEFAULT NULL,
  `task2_score`      DECIMAL(5,2) DEFAULT NULL,
  `task3_score`      DECIMAL(5,2) DEFAULT NULL,
  `task4_score`      DECIMAL(5,2) DEFAULT NULL,
  `overall_score`    DECIMAL(5,2) DEFAULT NULL,
  `risk_level`       ENUM('Low Risk','Moderate Risk','High Risk') DEFAULT NULL,
  `therapist_notes`  TEXT         DEFAULT NULL,   -- therapist can add notes here
  `reviewed_by`      INT          DEFAULT NULL,   -- therapist.id who reviewed
  `reviewed_at`      DATETIME     DEFAULT NULL,
  `completed_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_fas_child` (`child_id`),
  KEY `fk_fas_parent` (`parent_id`),
  KEY `fk_fas_therapist` (`reviewed_by`),
  CONSTRAINT `fk_fas_session`
    FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_fas_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_fas_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_fas_therapist`
    FOREIGN KEY (`reviewed_by`) REFERENCES `therapist` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  11. ACTIVITY  (learning activities assigned after assessment)
-- ================================================================
CREATE TABLE `activity` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `name`             VARCHAR(255) NOT NULL,
  `description`      TEXT,
  `difficulty_level` INT          NOT NULL DEFAULT 1,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  12. CHILD ACTIVITY PROGRESS
--  Tracks which activities a child has done and their score.
-- ================================================================
CREATE TABLE `child_activity_progress` (
  `id`          INT       NOT NULL AUTO_INCREMENT,
  `child_id`    INT       NOT NULL,
  `activity_id` INT       NOT NULL,
  `completed`   TINYINT(1) NOT NULL DEFAULT 0,
  `score`       INT       DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_activity` (`child_id`, `activity_id`),
  KEY `fk_cap_activity` (`activity_id`),
  CONSTRAINT `fk_cap_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cap_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  13. MESSAGE
--  Between parent and therapist, about a specific child.
-- ================================================================
CREATE TABLE `message` (
  `id`           INT  NOT NULL AUTO_INCREMENT,
  `parent_id`    INT  NOT NULL,
  `therapist_id` INT  NOT NULL,
  `child_id`     INT  DEFAULT NULL,   -- which child this conversation is about
  `sender_role`  ENUM('parent','therapist') NOT NULL,
  `content`      TEXT NOT NULL,
  `is_read`      TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_msg_parent` (`parent_id`),
  KEY `fk_msg_therapist` (`therapist_id`),
  KEY `fk_msg_child` (`child_id`),
  CONSTRAINT `fk_msg_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_msg_therapist`
    FOREIGN KEY (`therapist_id`) REFERENCES `therapist` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_msg_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  14. THERAPIST NOTE  (private notes therapist writes)
-- ================================================================
CREATE TABLE `therapist_note` (
  `id`           INT  NOT NULL AUTO_INCREMENT,
  `therapist_id` INT  NOT NULL,
  `child_id`     INT  DEFAULT NULL,  -- note about a specific child
  `note_text`    TEXT NOT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tn_therapist` (`therapist_id`),
  KEY `fk_tn_child` (`child_id`),
  CONSTRAINT `fk_tn_therapist`
    FOREIGN KEY (`therapist_id`) REFERENCES `therapist` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tn_child`
    FOREIGN KEY (`child_id`) REFERENCES `child` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  15. REFRESH TOKEN  (JWT refresh tokens for auth)
-- ================================================================
CREATE TABLE `refresh_token` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(128) NOT NULL,
  `user_id`    INT          NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `revoked`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  16. PASSWORD RESET TOKEN
-- ================================================================
CREATE TABLE `password_reset_token` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(128) NOT NULL,
  `user_id`    INT          NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  17. AUDIT LOG  (login events, security tracking)
-- ================================================================
CREATE TABLE `audit_log` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `user_id`    INT         NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`, `user_role`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ================================================================
--  STATIC CONTENT TABLES  (no changes needed)
-- ================================================================

CREATE TABLE `reading_words` (
  `id`            INT         NOT NULL AUTO_INCREMENT,
  `word_text`     VARCHAR(100) NOT NULL,
  `category`      ENUM('similar','non_similar','pseudo') NOT NULL,
  `display_order` INT         NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reading_texts` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT     NOT NULL,
  `word_count` INT      NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `letter_similarity_exercises` (
  `id`              INT         NOT NULL AUTO_INCREMENT,
  `exercise_number` INT         NOT NULL,
  `group1`          VARCHAR(50) NOT NULL,
  `group2`          VARCHAR(50) NOT NULL,
  `is_same`         TINYINT(1)  NOT NULL,
  `display_order`   INT         NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `number_sequences` (
  `id`                    INT       NOT NULL AUTO_INCREMENT,
  `sequence_number`       INT       NOT NULL,
  `numbers`               JSON      NOT NULL,
  `length`                INT       NOT NULL,
  `response_time_seconds` INT       NOT NULL,
  `display_order`         INT       NOT NULL DEFAULT 0,
  `created_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ================================================================
--  SEED DATA
-- ================================================================

INSERT INTO `therapist` (`id`, `username`, `email`, `password_hash`) VALUES
(1, 'therapist', 'therapist@dyslexiaplatform.com',
 '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi');

INSERT INTO `activity` (`id`, `name`, `description`, `difficulty_level`) VALUES
(1, 'Letter Recognition Basics', 'Learn to recognize basic alphabet letters', 1),
(2, 'Phonics Practice',          'Practice phonetic sounds and patterns',      2),
(3, 'Word Building',             'Build simple words from letter blocks',       2),
(4, 'Reading Comprehension',     'Read passages and answer questions',          3),
(5, 'Speed Reading Exercise',    'Improve reading speed with timed exercises',  3);

INSERT INTO `reading_texts` (`id`, `title`, `content`, `word_count`) VALUES
(1, 'The Teacher',
'While the children were sitting around their father, talking together, one of them asked: "Is there any similarity between you and the teacher, Father?" The father replied, "Yes." "The teacher, my son, takes care of your mind and dedicates his life to educating and guiding you. A polite student obeys teachers just as he obeys his parents and respects them. All teachers make great efforts to raise and educate students. Therefore, students should listen to their advice and recognize the teacher\'s value, just as they recognize the value of their parents." Then the father turned to his children and said, "Do not neglect your duties. Be kind to those who are kind to you. Work hard for your future and for the service of your country."',
85);

INSERT INTO `reading_words` (`word_text`, `category`, `display_order`) VALUES
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

INSERT INTO `letter_similarity_exercises`
  (`exercise_number`,`group1`,`group2`,`is_same`,`display_order`) VALUES
(1,'T Z R','T Z R',1,1),(2,'B L N','B L N',1,2),(3,'S D Z','Z D S',0,3),
(4,'F Q R S','SH S Q F',0,4),(5,'F Q','F Q',1,5),(6,'B Y T','B Y T',1,6),
(7,'A B M Y','A B M A',0,7),(8,'H KH J','H KH J',1,8),
(9,'Y R W','Y S J D',0,9),(10,'D D D D','D D D D',1,10),
(11,'A GH F','A GH F',1,11),(12,'Q S S','Q S S',1,12),
(13,'W Z R','R R Z W',0,13),(14,'TH DH H','TH DH H',1,14),
(15,'S SH S Z','S SH S Z',1,15),(16,'A L SH J R T','A L SH J R T',1,16),
(17,'TH F Q KH','Q F TH KH',0,17),(18,'Y I L A','I Y L A',0,18),
(19,'T TH B','T TH B',1,19),(20,'P R B','P R B',1,20);

INSERT INTO `number_sequences`
  (`sequence_number`,`numbers`,`length`,`response_time_seconds`,`display_order`) VALUES
(1,'[4,7]',2,10,1),(2,'[3,8,1]',3,15,2),(3,'[6,2,9,5]',4,20,3),
(4,'[1,4,7,2,8]',5,25,4),(5,'[5,0,9,3,6,1]',6,30,5),
(6,'[2,6,4,8,0,7,3]',7,35,6),(7,'[9,2]',2,10,7),(8,'[1,5,3]',3,15,8),
(9,'[7,0,6,2,4]',5,25,9),(10,'[8,3,1,9,5,2]',6,30,10);


-- ================================================================
--  BACKEND API — EXACT ROUTE LOGIC  (for your developers)
-- ================================================================
--
--  ① POST /api/session/start
--     Body: { child_name, child_grade }
--     Action: INSERT INTO child_session (child_name, child_grade) → get id
--     Return: { child_session_id: <integer> }
--     Frontend: localStorage.setItem('child_session_id', id)
--
--  ② POST /api/screening  (optional, before tasks)
--     Body: { child_session_id, answers, total_yes_count, risk_level, risk_score }
--     Action: INSERT INTO parent_screening (child_session_id, ...)
--
--  ③ POST /api/task1/submit
--     Body: { child_session_id, similar_words_score, ... }
--     Action: INSERT INTO task1_word_results (child_session_id, ...)
--
--  ④ POST /api/task2/submit  → task2_results
--  ⑤ POST /api/task3/submit  → task3_letter_similarity_results
--  ⑥ POST /api/task4/submit  → task4_number_memory_results
--
--  ⑦ POST /api/assessment/finalize
--     Body: { child_session_id }
--     Action: compute scores from tasks, INSERT INTO full_assessment_summary
--
--  ⑧ POST /api/auth/register
--     Body: { full_name, email, password, phone, child_session_id }
--     Transaction:
--       a) INSERT INTO parent (full_name, email, password_hash, ...) → parent_id
--       b) SELECT child_name, child_grade FROM child_session WHERE id = child_session_id
--       c) INSERT INTO child (parent_id, full_name, grade) → child_id
--       d) UPDATE child_session  SET parent_id=?, child_id=? WHERE id=?
--       e) UPDATE parent_screening SET parent_id=?, child_id=? WHERE child_session_id=?
--       f) UPDATE task1_word_results SET child_id=? WHERE child_session_id=?
--       g) UPDATE task2_results SET child_id=? WHERE child_session_id=?
--       h) UPDATE task3_letter_similarity_results SET child_id=? WHERE child_session_id=?
--       i) UPDATE task4_number_memory_results SET child_id=? WHERE child_session_id=?
--       j) UPDATE full_assessment_summary SET child_id=?, parent_id=? WHERE child_session_id=?
--     Return: JWT token
--
--  ⑨ POST /api/auth/add-child  (parent already logged in, adds second child)
--     Body: { child_name, child_grade }  (from signup page child name field)
--     Action:
--       INSERT INTO child_session (child_name, child_grade, parent_id)
--       INSERT INTO child (parent_id, full_name, grade) → child_id
--       UPDATE child_session SET child_id=? WHERE id=?
--     Return: { child_session_id, child_id }
--     → Then same task flow ③–⑦ using the new child_session_id
--
--  ⑩ GET /api/parent/dashboard
--     Returns all children + their latest assessment for logged-in parent:
--
--     SELECT
--       c.id              AS child_id,
--       c.full_name       AS child_name,
--       c.grade,
--       fas.overall_score,
--       fas.risk_level,
--       fas.task1_score,
--       fas.task2_score,
--       fas.task3_score,
--       fas.task4_score,
--       fas.completed_at,
--       cs.id             AS child_session_id
--     FROM child c
--     JOIN child_session cs ON cs.child_id = c.id
--     JOIN full_assessment_summary fas ON fas.child_session_id = cs.id
--     WHERE c.parent_id = ?
--     ORDER BY fas.completed_at DESC;
--
-- ================================================================childSessionRoutes.js