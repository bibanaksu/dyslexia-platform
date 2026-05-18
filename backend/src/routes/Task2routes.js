// backend/routes/Task2routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/submit', async (req, res) => {
  const {
    child_session_id,
    child_id,
    total_words,
    correct_count,
    incorrect_count,
    timeout_count,
    percentage,
    performance_level,
    total_time_seconds,
    avg_time_per_word,
    word_details,
  } = req.body;

  if (!child_session_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id is required.' 
    });
  }

  // Guard child_id: must be a positive integer or null (never 0/empty — FK will reject it)
  const _childId = (child_id && parseInt(child_id, 10) > 0) ? parseInt(child_id, 10) : null;

  try {
    const [result] = await db.execute(
      `INSERT INTO task2_results 
       (child_session_id, child_id, total_words, correct_count, incorrect_count, 
        timeout_count, percentage, performance_level, total_time_seconds, avg_time_per_word, word_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         child_id = VALUES(child_id),
         total_words = VALUES(total_words),
         correct_count = VALUES(correct_count),
         incorrect_count = VALUES(incorrect_count),
         timeout_count = VALUES(timeout_count),
         percentage = VALUES(percentage),
         performance_level = VALUES(performance_level),
         total_time_seconds = VALUES(total_time_seconds),
         avg_time_per_word = VALUES(avg_time_per_word),
         word_details = VALUES(word_details)`,
      [
        child_session_id,
        _childId,
        total_words || 0,
        correct_count || 0,
        incorrect_count || 0,
        timeout_count || 0,
        percentage || 0,
        performance_level || null,
        total_time_seconds || 0,
        avg_time_per_word || 0,
        word_details ? (typeof word_details === 'string' ? word_details : JSON.stringify(word_details)) : null,
      ]
    );

    let resultId = result.insertId;
    if (!resultId && child_session_id) {
      const [rows] = await db.execute(
        'SELECT id FROM task2_results WHERE child_session_id = ? LIMIT 1',
        [child_session_id]
      );
      if (rows.length) resultId = rows[0].id;
    }

    return res.json({ success: true, resultId });
  } catch (err) {
    console.error('task2/submit error:', err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

router.get('/results', async (req, res) => {
  const { child_session_id, child_id } = req.query;

  try {
    let sql, params;
    
    if (child_session_id) {
      sql = 'SELECT * FROM task2_results WHERE child_session_id = ?';
      params = [child_session_id];
    } else if (child_id) {
      sql = 'SELECT * FROM task2_results WHERE child_id = ?';
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
    console.error('task2/results error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;