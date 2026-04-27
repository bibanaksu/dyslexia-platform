// backend/routes/childInfoRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/child-info/start - NEW ROUTE for frontend
 * Body: { child_name, child_grade }
 */
router.post('/start', async (req, res) => {
  const { child_name, child_grade } = req.body;

  if (!child_name || !child_grade) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_name and child_grade are required.' 
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO child_session (child_name, child_grade) VALUES (?, ?)`,
      [child_name.trim(), parseInt(child_grade)]
    );
    
    return res.json({ 
      success: true, 
      child_session_id: result.insertId 
    });
  } catch (err) {
    console.error('child-info/start error:', err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

/**
 * POST /api/child-info/session
 * Body: { sessionUUID, childName, childGrade, childAge, parentId?, guestId? }
 */
router.post('/session', async (req, res) => {
  const { sessionUUID, childName, childGrade, childAge, parentId, guestId } = req.body;

  if (!sessionUUID || !childName || !childGrade) {
    return res.status(400).json({ 
      success: false, 
      error: 'sessionUUID, childName, and childGrade are required.' 
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO child_session (child_name, child_grade, parent_id)
       VALUES (?, ?, ?)`,
      [childName.trim(), parseInt(childGrade), parentId || null]
    );
    const sessionId = result.insertId;
    
    return res.json({ 
      success: true, 
      sessionUUID: sessionId.toString(),
      sessionId: sessionId,
      childId: null
    });
  } catch (err) {
    console.error('child-info/session error:', err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

/**
 * GET /api/child-info/session/:id
 */
router.get('/session/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM child_session WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    return res.json({ success: true, session: rows[0] });
  } catch (err) {
    console.error('session/get error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * GET /api/child-info/sessions?parentId=X
 */
router.get('/sessions', async (req, res) => {
  const { parentId } = req.query;
  if (!parentId) return res.status(400).json({ success: false, error: 'parentId required.' });

  try {
    const [sessions] = await db.execute(
      `SELECT cs.*,
              t1.percentage AS task1_pct,
              t2.percentage AS task2_pct,
              t3.percentage AS task3_pct,
              t4.overall_percentage AS task4_pct
       FROM child_session cs
       LEFT JOIN task1_word_results t1 ON t1.child_session_id = cs.id
       LEFT JOIN task2_results t2 ON t2.child_session_id = cs.id
       LEFT JOIN task3_letter_similarity_results t3 ON t3.child_session_id = cs.id
       LEFT JOIN task4_number_memory_results t4 ON t4.child_session_id = cs.id
       WHERE cs.parent_id = ?
       ORDER BY cs.created_at DESC`,
      [parentId]
    );
    return res.json({ success: true, sessions });
  } catch (err) {
    console.error('child-info/sessions error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;