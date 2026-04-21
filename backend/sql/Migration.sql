-- =====================================================
-- MIGRATION: Fix duplicate-row bug + add assessment summary
-- Run this ONCE against your existing dyslexia_db.
-- Safe to run on a fresh DB (uses IF NOT EXISTS / IGNORE).
-- =====================================================

USE dyslexia_db;

-- ─────────────────────────────────────────────────────
-- 1. Add UNIQUE on session_uuid to each task table.
--    ON DUPLICATE KEY UPDATE in the routes depends on this.
--    The ALTER IGNORE skips the constraint silently if it
--    already exists (MySQL 5.x). For MySQL 8 we use IF NOT EXISTS.
-- ─────────────────────────────────────────────────────

-- Task 1
SET @sql = (
  SELECT IF(
    COUNT(*) > 0,
    'SELECT ''task1 unique already exists'' AS msg',
    'ALTER TABLE task1_word_results ADD UNIQUE KEY uq_session_uuid (session_uuid)'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'task1_word_results'
    AND INDEX_NAME   = 'uq_session_uuid'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Task 2
SET @sql = (
  SELECT IF(
    COUNT(*) > 0,
    'SELECT ''task2 unique already exists'' AS msg',
    'ALTER TABLE task2_results ADD UNIQUE KEY uq_session_uuid (session_uuid)'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'task2_results'
    AND INDEX_NAME   = 'uq_session_uuid'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Task 3
SET @sql = (
  SELECT IF(
    COUNT(*) > 0,
    'SELECT ''task3 unique already exists'' AS msg',
    'ALTER TABLE task3_letter_similarity_results ADD UNIQUE KEY uq_session_uuid (session_uuid)'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'task3_letter_similarity_results'
    AND INDEX_NAME   = 'uq_session_uuid'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Task 4
SET @sql = (
  SELECT IF(
    COUNT(*) > 0,
    'SELECT ''task4 unique already exists'' AS msg',
    'ALTER TABLE task4_number_sequence_results ADD UNIQUE KEY uq_session_uuid (session_uuid)'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'task4_number_sequence_results'
    AND INDEX_NAME   = 'uq_session_uuid'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─────────────────────────────────────────────────────
-- 2. Create full_assessment_summary table
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS full_assessment_summary (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid  VARCHAR(64)   NOT NULL UNIQUE,
    child_name    VARCHAR(255)  NOT NULL,
    child_grade   VARCHAR(20)   NOT NULL,
    parent_id     INT           NULL,
    child_id      INT           NULL,

    -- individual task scores (percentage 0-100, NULL if task not yet done)
    task1_score   DECIMAL(5,2)  NULL COMMENT 'Word Explorer %',
    task2_score   DECIMAL(5,2)  NULL COMMENT 'Story Reader %',
    task3_score   DECIMAL(5,2)  NULL COMMENT 'Letter Detective %',
    task4_score   DECIMAL(5,2)  NULL COMMENT 'Number Memory %',

    overall_score DECIMAL(5,2)  NULL COMMENT 'Average of completed tasks',
    risk_level    VARCHAR(50)   NULL COMMENT 'Low Risk | Moderate Risk | High Risk',

    completed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES Parent(id) ON DELETE SET NULL,
    FOREIGN KEY (child_id)  REFERENCES Child(id)  ON DELETE SET NULL,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_parent_id    (parent_id),
    INDEX idx_child_id     (child_id),
    INDEX idx_risk_level   (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT '✅ Migration complete!' AS status;