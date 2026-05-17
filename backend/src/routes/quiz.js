const express = require('express');
const router = express.Router();
const pool = require('../db');

// ─────────────────────────────────────────────────────────────
// GET /api/quiz/questions
// ─────────────────────────────────────────────────────────────
router.get('/questions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, question_text, display_order FROM quiz_questions ORDER BY display_order'
    );
    res.json({ success: true, questions: rows });
  } catch (err) {
    console.error('Error fetching quiz questions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/quiz/submit
// ─────────────────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const {
      child_session_id,
      answers,
      questions,
      total_yes_count,
      risk_level,
      risk_score,
    } = req.body;

    // Build q1…q8 columns
    const qCols = {};
    if (Array.isArray(questions)) {
      questions.forEach(q => {
        const col = `q${q.display_order}`;
        const val = answers?.[q.id];
        qCols[col] = val === true ? 'yes' : val === false ? 'no' : null;
      });
    }
    for (let i = 1; i <= 8; i++) {
      if (!(`q${i}` in qCols)) qCols[`q${i}`] = null;
    }

    let parent_id = null;
    let child_id = null;

    if (child_session_id) {
      const [sessionRows] = await pool.query(
        `SELECT parent_id, child_id FROM child_session WHERE id = ? LIMIT 1`,
        [child_session_id]
      );
      if (sessionRows.length) {
        parent_id = sessionRows[0].parent_id ?? null;
        child_id = sessionRows[0].child_id ?? null;
      }
    }

    await pool.query(
      `INSERT INTO parent_screening
         (child_session_id, parent_id, child_id,
          q1, q2, q3, q4, q5, q6, q7, q8,
          answers, total_yes_count, risk_level, risk_score, created_at)
       VALUES (?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         parent_id       = VALUES(parent_id),
         child_id        = VALUES(child_id),
         q1 = VALUES(q1), q2 = VALUES(q2), q3 = VALUES(q3), q4 = VALUES(q4),
         q5 = VALUES(q5), q6 = VALUES(q6), q7 = VALUES(q7), q8 = VALUES(q8),
         answers         = VALUES(answers),
         total_yes_count = VALUES(total_yes_count),
         risk_level      = VALUES(risk_level),
         risk_score      = VALUES(risk_score),
         created_at      = NOW()`,
      [
        child_session_id ?? null,
        parent_id,
        child_id,
        qCols.q1, qCols.q2, qCols.q3, qCols.q4,
        qCols.q5, qCols.q6, qCols.q7, qCols.q8,
        JSON.stringify(answers),
        total_yes_count,
        risk_level,
        risk_score,
      ]
    );

    // If we inserted a new row and there is no child_session_id yet,
    // return the ID so frontend can link it later.
    let insertedId = null;
    if (!child_session_id) {
      const [last] = await pool.query('SELECT LAST_INSERT_ID() as id');
      insertedId = last[0]?.id;
    }

    res.json({
      success: true,
      message: 'Quiz results saved successfully',
      quiz_id: insertedId,
    });
  } catch (err) {
    console.error('Error saving quiz results:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/quiz/link-session
// Body: { guest_quiz_id, child_session_id }
// ─────────────────────────────────────────────────────────────
router.post('/link-session', async (req, res) => {
  try {
    const { guest_quiz_id, child_session_id } = req.body;

    if (!guest_quiz_id || !child_session_id) {
      return res.status(400).json({ error: 'guest_quiz_id and child_session_id are required' });
    }

    // Fetch parent_id & child_id from the newly created session
    const [sessionRows] = await pool.query(
      `SELECT parent_id, child_id FROM child_session WHERE id = ? LIMIT 1`,
      [child_session_id]
    );

    if (!sessionRows.length) {
      return res.status(404).json({ error: 'child_session not found' });
    }

    const { parent_id, child_id } = sessionRows[0];

    // Update the pending quiz row
    const [result] = await pool.query(
      `UPDATE parent_screening
          SET child_session_id = ?,
              parent_id        = ?,
              child_id         = ?
        WHERE id = ?`,
      [child_session_id, parent_id ?? null, child_id ?? null, guest_quiz_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending quiz not found' });
    }

    res.json({ success: true, message: 'Quiz linked to session successfully' });
  } catch (err) {
    console.error('Error linking quiz to session:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;