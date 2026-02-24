-- ─────────────────────────────────────────────────────────────────────────────
-- migration_dashboard.sql
-- Run this once to add the tables/columns the dashboard routes need.
-- mysql -u root -p dyslexia_db < migration_dashboard.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add optional dob column to Child (used for age calculation)
ALTER TABLE Child
  ADD COLUMN IF NOT EXISTS dob DATE NULL AFTER grade;

-- 2. Add reviewed flag to Assessment (used for Pending Reviews count)
ALTER TABLE Assessment
  ADD COLUMN IF NOT EXISTS reviewed TINYINT(1) NOT NULL DEFAULT 0 AFTER notes;

-- 3. Therapist notes table
CREATE TABLE IF NOT EXISTS TherapistNote (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  therapist_id  INT UNSIGNED   NULL,
  note_text     TEXT           NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_therapist (therapist_id),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Seed two sample notes so the dashboard shows something right away
INSERT IGNORE INTO TherapistNote (note_text, created_at)
VALUES
  ('Follow up with Sarah''s parents regarding the updated intervention plan.',
   '2023-12-12 09:00:00'),
  ('Prepare assessment materials for Leo''s mid-term review.',
   '2023-12-11 14:30:00');

-- 5. Back-fill approximate dob from existing data (sets age ~8 as placeholder)
UPDATE Child
   SET dob = DATE_SUB(CURDATE(), INTERVAL 8 YEAR)
 WHERE dob IS NULL;