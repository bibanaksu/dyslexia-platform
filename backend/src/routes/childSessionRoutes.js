// backend/routes/childSessionRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/session/start
 * Body: { child_name, child_grade }
 * Returns: { child_session_id: integer }
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
    console.error('session/start error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * GET /api/session/:id
 * Get session info by ID
 */
router.get('/:id', async (req, res) => {
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
 * POST /api/session/link
 * Link a session to parent and child after registration
 */
router.post('/link', async (req, res) => {
  const { child_session_id, parent_id, child_id } = req.body;

  if (!child_session_id || !parent_id || !child_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id, parent_id, and child_id are required.' 
    });
  }

  try {
    await db.execute(
      `UPDATE child_session 
       SET parent_id = ?, child_id = ? 
       WHERE id = ?`,
      [parent_id, child_id, child_session_id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('session/link error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;