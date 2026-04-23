-- =====================================================
-- MIGRATION V3 — Messages / Chat Feature
-- Run ONCE against your existing dyslexia_db
-- =====================================================
--   docker exec -i dyslexia-mysql \
--     mysql -u root -pdyslexia_password dyslexia_db \
--     < migration_v3.sql
-- =====================================================

USE dyslexia_db;

-- ── TABLE: Messages ───────────────────────────────────────────
-- Stores parent ↔ therapist chat messages.
-- therapist_id is NULL when no therapist is assigned yet.
CREATE TABLE IF NOT EXISTS Messages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    parent_id    INT                        NOT NULL,
    therapist_id INT                        NULL,
    sender_role  ENUM('parent','therapist') NOT NULL,
    content      TEXT                       NOT NULL,
    is_read      BOOLEAN                    NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id)    REFERENCES Parent(id)    ON DELETE CASCADE,
    FOREIGN KEY (therapist_id) REFERENCES Therapist(id) ON DELETE SET NULL,
    INDEX idx_parent_id    (parent_id),
    INDEX idx_therapist_id (therapist_id),
    INDEX idx_created_at   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Verification ──────────────────────────────────────────────
SELECT 'Migration v3 complete!' AS status;
SHOW TABLES LIKE 'Messages';