// backend/routes/Taskfour.js - Number Memory Task (combined sequence + reversal)
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/submit', async (req, res) => {
  const {
    child_session_id,
    child_id,
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
    performance_level,
  } = req.body;

  if (!child_session_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id is required.' 
    });
  }

  // Guard child_id: must be a positive integer or null (never 0/empty — FK will reject it)
  const _childId = (child_id && parseInt(child_id, 10) > 0) ? parseInt(child_id, 10) : null;

  // Serialize JSON fields safely
  const _seqDetails = seq_details
    ? (typeof seq_details === 'string' ? seq_details : JSON.stringify(seq_details))
    : null;
  const _revDetails = rev_details
    ? (typeof rev_details === 'string' ? rev_details : JSON.stringify(rev_details))
    : null;

  try {
    const [result] = await db.execute(
      `INSERT INTO task4_number_memory_results 
       (child_session_id, child_id,
        seq_total, seq_correct, seq_incorrect, seq_timeout, 
        seq_percentage, seq_time_seconds, seq_details,
        rev_total, rev_correct, rev_incorrect, rev_timeout,
        rev_percentage, rev_time_seconds, rev_details,
        overall_percentage, performance_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        child_id = VALUES(child_id),
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
        overall_percentage = VALUES(overall_percentage),
        performance_level = VALUES(performance_level)`,
      [
        child_session_id,
        _childId,
        seq_total || 20, seq_correct || 0, seq_incorrect || 0, seq_timeout || 0,
        seq_percentage || 0, seq_time_seconds || 0, _seqDetails,
        rev_total || 10, rev_correct || 0, rev_incorrect || 0, rev_timeout || 0,
        rev_percentage || 0, rev_time_seconds || 0, _revDetails,
        overall_percentage || 0,
        performance_level || null,
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
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
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
    console.error('task4/results error:', err);
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
    console.error('task4/stats error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;