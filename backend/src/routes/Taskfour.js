// backend/routes/Taskfour.js - Number Memory Task (combined sequence + reversal)
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/submit', async (req, res) => {
  const {
    child_session_id,
    // Sequence sub-task
    seq_total,
    seq_correct,
    seq_incorrect,
    seq_timeout,
    seq_percentage,
    seq_time_seconds,
    seq_details,
    // Reversal sub-task
    rev_total,
    rev_correct,
    rev_incorrect,
    rev_timeout,
    rev_percentage,
    rev_time_seconds,
    rev_details,
    // Combined
    overall_percentage,
    // performance_level removed
  } = req.body;

  if (!child_session_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id is required.' 
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO task4_number_memory_results 
       (child_session_id,
        seq_total, seq_correct, seq_incorrect, seq_timeout, 
        seq_percentage, seq_time_seconds, seq_details,
        rev_total, rev_correct, rev_incorrect, rev_timeout,
        rev_percentage, rev_time_seconds, rev_details,
        overall_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        seq_total = VALUES(seq_total),
        seq_correct = VALUES(seq_correct),
        seq_incorrect = VALUES(seq_incorrect),
        seq_timeout = VALUES(seq_timeout),
        seq_percentage = VALUES(seq_percentage),
        seq_time_seconds = VALUES(seq_time_seconds),
        seq_details = VALUES(seq_details),
        rev_total = VALUES(rev_total),
        rev_correct = VALUES(rev_correct),
        rev_incorrect = VALUES(rev_incorrect),
        rev_timeout = VALUES(rev_timeout),
        rev_percentage = VALUES(rev_percentage),
        rev_time_seconds = VALUES(rev_time_seconds),
        rev_details = VALUES(rev_details),
        overall_percentage = VALUES(overall_percentage)`,
      [
        child_session_id,
        seq_total || 20, seq_correct || 0, seq_incorrect || 0, seq_timeout || 0,
        seq_percentage || 0, seq_time_seconds || 0, seq_details || null,
        rev_total || 10, rev_correct || 0, rev_incorrect || 0, rev_timeout || 0,
        rev_percentage || 0, rev_time_seconds || 0, rev_details || null,
        overall_percentage || 0,
      ]
    );

    let resultId = result.insertId;
    if (!resultId && child_session_id) {
      const [rows] = await db.execute(
        'SELECT id FROM task4_number_memory_results WHERE child_session_id = ? LIMIT 1',
        [child_session_id]
      );
      if (rows.length) resultId = rows[0].id;
    }

    return res.json({ success: true, resultId });
  } catch (err) {
    console.error('task4/submit error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

router.get('/results', async (req, res) => {
  const { child_session_id, child_id } = req.query;

  try {
    let sql, params;
    
    if (child_session_id) {
      sql = 'SELECT * FROM task4_number_memory_results WHERE child_session_id = ?';
      params = [child_session_id];
    } else if (child_id) {
      sql = 'SELECT * FROM task4_number_memory_results WHERE child_id = ?';
      params = [child_id];
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Provide child_session_id or child_id.' 
      });
    }
    
    const [rows] = await db.execute(sql, params);
    return res.json({ success: true, results: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

router.get('/stats/:childId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS attempts, 
              AVG(overall_percentage) AS avg_pct, 
              MAX(overall_percentage) AS best_pct 
       FROM task4_number_memory_results 
       WHERE child_id = ?`,
      [req.params.childId]
    );
    return res.json({ success: true, stats: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;