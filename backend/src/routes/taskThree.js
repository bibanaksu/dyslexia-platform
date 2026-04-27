// backend/routes/taskThree.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/exercises', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM letter_similarity_exercises ORDER BY display_order ASC'
    );
    return res.json({ success: true, exercises: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

router.post('/submit', async (req, res) => {
  const {
    child_session_id,
    total_comparisons,
    correct_count,
    incorrect_count,
    timeout_count,
    percentage,
    performance_level,
    total_time_seconds,
    avg_time_per_item,
    comparison_details,
  } = req.body;

  if (!child_session_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id is required.' 
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO task3_letter_similarity_results 
       (child_session_id, total_comparisons, correct_count, 
        incorrect_count, timeout_count, percentage, performance_level,
        total_time_seconds, avg_time_per_item, comparison_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_comparisons = VALUES(total_comparisons),
         correct_count = VALUES(correct_count),
         incorrect_count = VALUES(incorrect_count),
         timeout_count = VALUES(timeout_count),
         percentage = VALUES(percentage),
         performance_level = VALUES(performance_level),
         total_time_seconds = VALUES(total_time_seconds),
         avg_time_per_item = VALUES(avg_time_per_item),
         comparison_details = VALUES(comparison_details)`,
      [
        child_session_id,
        total_comparisons || 20,
        correct_count || 0,
        incorrect_count || 0,
        timeout_count || 0,
        percentage || 0,
        performance_level || null,
        total_time_seconds || 0,
        avg_time_per_item || 0,
        comparison_details || null,
      ]
    );

    let resultId = result.insertId;
    if (!resultId && child_session_id) {
      const [rows] = await db.execute(
        'SELECT id FROM task3_letter_similarity_results WHERE child_session_id = ? LIMIT 1',
        [child_session_id]
      );
      if (rows.length) resultId = rows[0].id;
    }

    return res.json({ success: true, resultId });
  } catch (err) {
    console.error('task3/submit error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

router.get('/results', async (req, res) => {
  const { child_session_id, child_id } = req.query;

  try {
    let sql, params;
    
    if (child_session_id) {
      sql = 'SELECT * FROM task3_letter_similarity_results WHERE child_session_id = ?';
      params = [child_session_id];
    } else if (child_id) {
      sql = 'SELECT * FROM task3_letter_similarity_results WHERE child_id = ?';
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

module.exports = router;