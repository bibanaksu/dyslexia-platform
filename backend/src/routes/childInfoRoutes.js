// backend/routes/childInfoRoutes.js
// Saves the child-info session row so all 4 task results
// can be linked by session_uuid.

const express = require('express');
const router  = express.Router();
const db = require('../db');

/**
 * POST /api/child-info/session
 * Body: { sessionUUID, childName, childGrade, parentId?, guestId? }
 */
router.post('/session', async (req, res) => {
  const { sessionUUID, childName, childGrade, parentId, guestId } = req.body;

  if (!sessionUUID || !childName || !childGrade) {
    return res.status(400).json({ success: false, error: 'sessionUUID, childName, and childGrade are required.' });
  }

  try {
    // Try to find an existing Child row that matches name + parent
    let childId = null;
    if (parentId) {
      const [rows] = await db.execute(
        'SELECT id FROM Child WHERE full_name = ? AND parent_id = ? LIMIT 1',
        [childName, parentId]
      );
      if (rows.length > 0) childId = rows[0].id;
    }

    await db.execute(
      `INSERT INTO child_info_sessions
         (session_uuid, child_name, child_grade, parent_id, child_id, guest_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         child_name  = VALUES(child_name),
         child_grade = VALUES(child_grade)`,
      [sessionUUID, childName, childGrade, parentId || null, childId || null, guestId || null]
    );

    return res.json({ success: true, sessionUUID, childId });
  } catch (err) {
    console.error('child-info/session error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * GET /api/child-info/sessions?parentId=X
 * Returns all sessions (i.e. all child visits) for a parent —
 * useful for a dashboard that lists all children's results.
 */
router.get('/sessions', async (req, res) => {
  const { parentId } = req.query;
  if (!parentId) return res.status(400).json({ success: false, error: 'parentId required.' });

  try {
    const [sessions] = await db.execute(
      `SELECT s.*,
              t1.percentage  AS task1_pct,
              t2.percentage  AS task2_pct,
              t3.percentage  AS task3_pct,
              t4.percentage  AS task4_pct
       FROM   child_info_sessions s
       LEFT JOIN task1_word_results              t1 ON t1.session_uuid = s.session_uuid AND t1.is_partial = 0
       LEFT JOIN task2_results                   t2 ON t2.session_uuid = s.session_uuid AND t2.is_partial = 0
       LEFT JOIN task3_letter_similarity_results t3 ON t3.session_uuid = s.session_uuid AND t3.is_partial = 0
       LEFT JOIN task4_number_sequence_results   t4 ON t4.session_uuid = s.session_uuid AND t4.is_partial = 0
       WHERE  s.parent_id = ?
       ORDER BY s.created_at DESC`,
      [parentId]
    );
    return res.json({ success: true, sessions });
  } catch (err) {
    console.error('child-info/sessions error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;