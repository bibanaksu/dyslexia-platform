const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path to your DB connection

// GET /api/quiz/questions
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

// POST /api/quiz/submit
router.post('/submit', async (req, res) => {
  try {
    const { child_session_id, answers, total_yes_count, risk_level, risk_score } = req.body;

    if (!child_session_id) {
      return res.status(400).json({ error: 'child_session_id is required' });
    }

    // Insert or update screening record
    await pool.query(
      `INSERT INTO parent_screening 
       (child_session_id, answers, total_yes_count, risk_level, risk_score, completed_at) 
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       answers = VALUES(answers), 
       total_yes_count = VALUES(total_yes_count),
       risk_level = VALUES(risk_level),
       risk_score = VALUES(risk_score),
       completed_at = NOW()`,
      [child_session_id, JSON.stringify(answers), total_yes_count, risk_level, risk_score]
    );

    res.json({ success: true, message: 'Quiz results saved successfully' });
  } catch (err) {
    console.error('Error saving quiz results:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;