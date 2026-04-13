-- =====================================================
-- MIGRATION V2 — Session Hardening & Password Reset
-- Run ONCE against your existing dyslexia_db
-- =====================================================
--   docker exec -i dyslexia-mysql \
--     mysql -u root -pdyslexia_password dyslexia_db \
--     < migration_v2.sql
-- =====================================================

USE dyslexia_db;

-- ── TABLE: PasswordResetToken ─────────────────────────────────
-- Stores short-lived tokens for the forgot-password flow.
-- One active (unused, unexpired) token per user at a time.
CREATE TABLE IF NOT EXISTS PasswordResetToken (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(128)             NOT NULL UNIQUE,   -- crypto random hex
    user_id    INT                      NOT NULL,
    user_role  ENUM('therapist','parent') NOT NULL,
    expires_at DATETIME                 NOT NULL,          -- NOW() + 15 min
    used       BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token      (token),
    INDEX idx_user       (user_id, user_role),
    INDEX idx_expires_at (expires_at)
);

-- ── TABLE: RefreshToken ───────────────────────────────────────
-- Stores long-lived refresh tokens (7 days).
-- Sent to client as httpOnly cookie — never in localStorage.
-- Each row = one active session. Logout deletes the row.
CREATE TABLE IF NOT EXISTS RefreshToken (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(128)             NOT NULL UNIQUE,   -- crypto random hex
    user_id    INT                      NOT NULL,
    user_role  ENUM('therapist','parent') NOT NULL,
    expires_at DATETIME                 NOT NULL,          -- NOW() + 7 days
    ip_address VARCHAR(45)              NULL,
    user_agent TEXT                     NULL,
    revoked    BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token   (token),
    INDEX idx_user    (user_id, user_role),
    INDEX idx_expires (expires_at)
);

-- ── Extend AuditLog event_type for new events ─────────────────
-- (already VARCHAR(50) from v1 fix — nothing to alter)
-- Supported values now: login_success | login_failure |
--                       logout | password_change | password_reset_request

-- ── Verification ──────────────────────────────────────────────
SELECT 'Migration v2 complete!' AS status;
SHOW TABLES LIKE '%Token%';