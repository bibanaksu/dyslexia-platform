// backend/src/routes/therapist.js
const express = require('express');
const pool    = require('../db');
const { verifyToken, requireTherapist } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireTherapist);

// GET /api/therapist/patients
router.get('/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id AS child_id,
        c.full_name AS child_name,
        c.grade,
        c.dob,
        p.id AS parent_id,
        p.full_name AS parent_name,
        p.email AS parent_email,
        p.phone AS parent_phone,
        fas.id AS assessment_id,
        fas.child_session_id,
        fas.overall_score,
        fas.risk_level,
        fas.task1_score,
        fas.task2_score,
        fas.task3_score,
        fas.task4_score,
        fas.completed_at,
        fas.reviewed_by,
        cs.created_at AS session_started_at
      FROM child c
      JOIN parent p ON p.id = c.parent_id
      LEFT JOIN child_session cs ON cs.child_id = c.id
      LEFT JOIN full_assessment_summary fas ON fas.child_session_id = cs.id
      WHERE p.assigned_therapist_id = ?
      ORDER BY fas.completed_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /therapist/patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/therapist/screening/:childId
router.get('/screening/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const [[child]] = await pool.query(
      `SELECT c.id FROM child c
       JOIN parent p ON p.id = c.parent_id
       WHERE c.id = ? AND p.assigned_therapist_id = ?`,
      [childId, req.user.id]
    );
    if (!child) return res.status(403).json({ error: 'Access denied' });

    const [rows] = await pool.query(
      `SELECT ps.id, ps.child_session_id, ps.parent_id, ps.answers,
              ps.total_yes_count, ps.risk_level, ps.risk_score, ps.created_at
       FROM parent_screening ps
       JOIN child_session cs ON cs.id = ps.child_session_id
       WHERE cs.child_id = ?
       ORDER BY ps.created_at DESC LIMIT 1`,
      [childId]
    );
    if (rows.length === 0) return res.json({ success: true, screening: null });
    const screening = rows[0];
    if (screening.answers && typeof screening.answers === 'string')
      screening.answers = JSON.parse(screening.answers);
    res.json({ success: true, screening });
  } catch (err) {
    console.error('GET /therapist/screening error:', err);
    res.status(500).json({ error: 'Failed to fetch screening' });
  }
});

// GET /api/therapist/notes
router.get('/notes', async (req, res) => {
  try {
    const { childId } = req.query;
    let sql = `
      SELECT tn.*, c.full_name AS child_name
      FROM therapist_note tn
      LEFT JOIN child c ON c.id = tn.child_id
      WHERE tn.therapist_id = ?
    `;
    const params = [req.user.id];
    if (childId) { sql += ' AND tn.child_id = ?'; params.push(parseInt(childId)); }
    sql += ' ORDER BY tn.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /therapist/notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/therapist/notes
router.post('/notes', async (req, res) => {
  try {
    const { child_id, note_text } = req.body;
    if (!note_text?.trim()) return res.status(400).json({ error: 'note_text is required' });
    const [result] = await pool.query(
      'INSERT INTO therapist_note (therapist_id, child_id, note_text) VALUES (?, ?, ?)',
      [req.user.id, child_id || null, note_text.trim()]
    );
    const [[note]] = await pool.query('SELECT * FROM therapist_note WHERE id = ?', [result.insertId]);
    res.status(201).json(note);
  } catch (err) {
    console.error('POST /therapist/notes error:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// DELETE /api/therapist/notes/:id
router.delete('/notes/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM therapist_note WHERE id = ? AND therapist_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('DELETE /therapist/notes error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// GET /api/therapist/assignments
router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cap.*, c.full_name AS child_name, a.name AS activity_name,
             a.description AS activity_description, a.difficulty_level
      FROM child_activity_progress cap
      JOIN child c ON c.id = cap.child_id
      JOIN activity a ON a.id = cap.activity_id
      ORDER BY cap.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /therapist/assignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/therapist/assignments
router.post('/assignments', async (req, res) => {
  try {
    const { child_id, activity_id } = req.body;
    if (!child_id || !activity_id) return res.status(400).json({ error: 'child_id and activity_id are required' });
    await pool.query(
      `INSERT INTO child_activity_progress (child_id, activity_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [child_id, activity_id]
    );
    res.json({ message: 'Activity assigned successfully' });
  } catch (err) {
    console.error('POST /therapist/assignments error:', err);
    res.status(500).json({ error: 'Failed to assign activity' });
  }
});

module.exports = router;