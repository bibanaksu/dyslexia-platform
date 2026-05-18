// backend/routes/Task1routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/submit', async (req, res) => {
  const {
    child_session_id,
    child_id,
    similar_words_score,
    non_similar_words_score,
    pseudo_words_score,
    total_score,
    percentage,
    performance_level,
    total_time_seconds,
    avg_time_per_word,
    error_patterns,
  } = req.body;

  if (!child_session_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'child_session_id is required.' 
    });
  }

  // Guard child_id: must be a positive integer or null (never 0/empty — FK will reject it)
  const _childId = (child_id && parseInt(child_id, 10) > 0) ? parseInt(child_id, 10) : null;
  const _similarWordsScore    = similar_words_score    ?? 0;
  const _nonSimilarWordsScore = non_similar_words_score ?? 0;
  const _pseudoWordsScore     = pseudo_words_score     ?? 0;
  const _totalScore           = total_score            ?? 0;
  const _percentage           = percentage             ?? 0;
  const _performanceLevel     = performance_level      || null;
  const _totalTimeSeconds     = total_time_seconds     ?? 0;
  const _avgTimePerWord       = avg_time_per_word      ?? 0;
  // Serialize error_patterns to JSON string if it's an object/array
  const _errorPatterns = error_patterns
    ? (typeof error_patterns === 'string' ? error_patterns : JSON.stringify(error_patterns))
    : null;
  const totalWords = 60;

  try {
    const [result] = await db.execute(
      `INSERT INTO task1_word_results
         (child_session_id, child_id,
          similar_words_score, non_similar_words_score, pseudo_words_score,
          total_score, total_words, percentage, performance_level,
          total_time_seconds, avg_time_per_word, error_patterns)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         child_id = VALUES(child_id),
         similar_words_score = VALUES(similar_words_score),
         non_similar_words_score = VALUES(non_similar_words_score),
         pseudo_words_score = VALUES(pseudo_words_score),
         total_score = VALUES(total_score),
         percentage = VALUES(percentage),
         performance_level = VALUES(performance_level),
         total_time_seconds = VALUES(total_time_seconds),
         avg_time_per_word = VALUES(avg_time_per_word),
         error_patterns = VALUES(error_patterns)`,
      [
        child_session_id, _childId,
        _similarWordsScore, _nonSimilarWordsScore, _pseudoWordsScore,
        _totalScore, totalWords, _percentage, _performanceLevel,
        _totalTimeSeconds, _avgTimePerWord, _errorPatterns,
      ]
    );

    let resultId = result.insertId;
    if (!resultId && child_session_id) {
      const [rows] = await db.execute(
        'SELECT id FROM task1_word_results WHERE child_session_id = ? LIMIT 1',
        [child_session_id]
      );
      if (rows.length) resultId = rows[0].id;
    }

    return res.json({ success: true, resultId });
  } catch (err) {
    console.error('task1/submit error:', err);
    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
  }
});

router.get('/results', async (req, res) => {
  const { child_session_id, child_id } = req.query;

  try {
    let sql, params;
    if (child_session_id) {
      sql = 'SELECT * FROM task1_word_results WHERE child_session_id = ?';
      params = [child_session_id];
    } else if (child_id) {
      sql = 'SELECT * FROM task1_word_results WHERE child_id = ?';
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
    console.error('task1/results error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;