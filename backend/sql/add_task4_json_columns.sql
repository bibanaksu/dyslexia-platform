-- 🚨 CRITICAL: Fix Task Details API Error
-- Run this SQL **ONCE** to add missing JSON columns
-- Fixes: "Champ 'sequence_details' inconnu" + JSON parse errors

USE dyslexia_db;

-- 1. Safely add missing columns (idempotent)
ALTER TABLE task4_number_memory_results 
ADD COLUMN IF NOT EXISTS sequence_details JSON DEFAULT NULL COMMENT 'Forward sequence JSON details',
ADD COLUMN IF NOT EXISTS reversal_details JSON DEFAULT NULL COMMENT 'Reversal sequence JSON details';

-- 2. Verify columns exist
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'dyslexia_db' 
  AND TABLE_NAME = 'task4_number_memory_results' 
  AND COLUMN_NAME IN ('sequence_details', 'reversal_details');

-- 3. Test data for session ID 11 (your error case)
SELECT id, child_session_id, seq_details, rev_details 
FROM task4_number_memory_results 
WHERE child_session_id = 11;

-- 4. Check ALL sessions have data structure
SELECT COUNT(*) as total_sessions,
       COUNT(seq_details) as with_seq_details,
       COUNT(rev_details) as with_rev_details
FROM task4_number_memory_results;

SELECT '✅ DB Migration & Verification COMPLETE! Restart backend server.' AS status;
SELECT '🧪 Test API: curl "http://localhost:5000/api/task-details/11"' AS next_step;
