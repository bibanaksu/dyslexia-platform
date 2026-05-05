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

// ✅ NEW ROUTE: Get assignments for a specific child (used by parent dashboard)
router.get('/assignments/child/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const [rows] = await pool.query(`
      SELECT cap.*, a.name AS activity_name, a.type, a.description, a.difficulty_level
      FROM child_activity_progress cap
      JOIN activity a ON a.id = cap.activity_id
      WHERE cap.child_id = ?
    `, [childId]);
    res.json({ assignments: rows });
  } catch (err) {
    console.error('GET /therapist/assignments/child/:childId error:', err);
    res.status(500).json({ error: 'Failed to fetch child assignments' });
  }
});

// GET /api/therapist/child-task-details/:childSessionId
router.get('/child-task-details/:childSessionId', async (req, res) => {
  try {
    const { childSessionId } = req.params;

    const [[session]] = await pool.query(
      `SELECT cs.id, cs.child_id, cs.child_name, cs.child_grade,
              c.full_name AS registered_name, p.assigned_therapist_id
       FROM child_session cs
       LEFT JOIN child c ON c.id = cs.child_id
       LEFT JOIN parent p ON p.id = c.parent_id
       WHERE cs.id = ?`,
      [childSessionId]
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.assigned_therapist_id && session.assigned_therapist_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [task1Rows] = await pool.query(
      'SELECT * FROM task1_word_results WHERE child_session_id = ? ORDER BY completed_at DESC LIMIT 1',
      [childSessionId]
    );
    const [task2Rows] = await pool.query(
      'SELECT * FROM task2_results WHERE child_session_id = ? ORDER BY completed_at DESC LIMIT 1',
      [childSessionId]
    );
    const [task3Rows] = await pool.query(
      'SELECT * FROM task3_letter_similarity_results WHERE child_session_id = ? ORDER BY completed_at DESC LIMIT 1',
      [childSessionId]
    );
    const [task4Rows] = await pool.query(
      'SELECT * FROM task4_number_memory_results WHERE child_session_id = ? ORDER BY completed_at DESC LIMIT 1',
      [childSessionId]
    );

    const parseJson = (val) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return null; }
    };

    const t1 = task1Rows[0] || null;
    const t2 = task2Rows[0] || null;
    const t3 = task3Rows[0] || null;
    const t4 = task4Rows[0] || null;

    res.json({
      success: true,
      childSessionId: parseInt(childSessionId),
      childName: session.child_name || session.registered_name || 'Unknown',
      childGrade: session.child_grade,
      task1: t1 ? {
        percentage: t1.percentage,
        similarWordsScore: t1.similar_words_score,
        nonSimilarWordsScore: t1.non_similar_words_score,
        pseudoWordsScore: t1.pseudo_words_score,
        totalScore: t1.total_score,
        totalWords: t1.total_words,
        performanceLevel: t1.performance_level,
        totalTimeSeconds: t1.total_time_seconds,
        avgTimePerWord: t1.avg_time_per_word,
        errorPatterns: parseJson(t1.error_patterns),
        completedAt: t1.completed_at,
      } : null,
      task2: t2 ? {
        percentage: t2.percentage,
        totalWords: t2.total_words,
        correctCount: t2.correct_count,
        incorrectCount: t2.incorrect_count,
        timeoutCount: t2.timeout_count,
        performanceLevel: t2.performance_level,
        totalTimeSeconds: t2.total_time_seconds,
        avgTimePerWord: t2.avg_time_per_word,
        wordDetails: parseJson(t2.word_details),
        completedAt: t2.completed_at,
      } : null,
      task3: t3 ? {
        percentage: t3.percentage,
        totalComparisons: t3.total_comparisons,
        correctCount: t3.correct_count,
        incorrectCount: t3.incorrect_count,
        timeoutCount: t3.timeout_count,
        performanceLevel: t3.performance_level,
        totalTimeSeconds: t3.total_time_seconds,
        avgTimePerItem: t3.avg_time_per_item,
        comparisonDetails: parseJson(t3.comparison_details),
        completedAt: t3.completed_at,
      } : null,
      task4: t4 ? {
        overallPercentage: t4.overall_percentage,
        performanceLevel: t4.performance_level,
        sequence: {
          total: t4.seq_total, correct: t4.seq_correct,
          incorrect: t4.seq_incorrect, timeout: t4.seq_timeout,
          percentage: t4.seq_percentage, timeSeconds: t4.seq_time_seconds,
          details: parseJson(t4.seq_details),
        },
        reversal: {
          total: t4.rev_total, correct: t4.rev_correct,
          incorrect: t4.rev_incorrect, timeout: t4.rev_timeout,
          percentage: t4.rev_percentage, timeSeconds: t4.rev_time_seconds,
          details: parseJson(t4.rev_details),
        },
        completedAt: t4.completed_at,
      } : null,
    });
  } catch (err) {
    console.error('GET /therapist/child-task-details error:', err);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

module.exports = router;