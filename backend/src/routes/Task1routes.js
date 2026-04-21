// backend/routes/Task1routes.js  — FIXED: UPSERT pattern, no duplicate rows
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/**
 * POST /api/task1/submit
 * Uses INSERT … ON DUPLICATE KEY UPDATE on session_uuid.
 * First call → INSERT (returns insertId).
 * Subsequent calls with same session_uuid → UPDATE (returns id=0, we fetch real id).
 */
router.post('/submit', async (req, res) => {
  const {
    sessionUUID, session_uuid,
    childId, child_id,
    parentId, parent_id,
    childName, child_name,
    childGrade, child_grade,
    similarWordsScore, similar_words_score,
    nonSimilarWordsScore, non_similar_words_score,
    pseudoWordsScore, pseudo_words_score,
    totalScore, total_score,
    percentage,
    performanceLevel, performance_level,
    totalTimeSeconds, total_time_seconds,
    avgTimePerWord, avg_time_per_word,
    errorPatterns, error_patterns,
    isPartial, is_partial,
  } = req.body;

  const _sessionUUID          = sessionUUID          || session_uuid          || null;
  const _childId              = childId              || child_id              || null;
  const _parentId             = parentId             || parent_id             || null;
  const _childName            = childName            || child_name            || 'Guest User';
  const _childGrade           = childGrade           || child_grade           || 'Not Specified';
  const _similarWordsScore    = similarWordsScore    ?? similar_words_score   ?? 0;
  const _nonSimilarWordsScore = nonSimilarWordsScore ?? non_similar_words_score ?? 0;
  const _pseudoWordsScore     = pseudoWordsScore     ?? pseudo_words_score    ?? 0;
  const _totalScore           = totalScore           ?? total_score           ?? 0;
  const _percentage           = percentage           ?? 0;
  const _performanceLevel     = performanceLevel     || performance_level     || null;
  const _totalTimeSeconds     = totalTimeSeconds     ?? total_time_seconds    ?? 0;
  const _avgTimePerWord       = avgTimePerWord       ?? avg_time_per_word     ?? 0;
  const _errorPatterns        = errorPatterns        || error_patterns        || null;
  const _isPartial            = (isPartial !== undefined ? isPartial : (is_partial ?? 0)) ? 1 : 0;
  const totalWords            = 60;

  try {
    const [result] = await db.execute(
      `INSERT INTO task1_word_results
         (session_uuid, child_id, parent_id, child_name, child_grade,
          similar_words_score, non_similar_words_score, pseudo_words_score,
          total_score, total_words, percentage, performance_level,
          total_time_seconds, avg_time_per_word, error_patterns, is_partial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         child_name              = VALUES(child_name),
         child_grade             = VALUES(child_grade),
         similar_words_score     = VALUES(similar_words_score),
         non_similar_words_score = VALUES(non_similar_words_score),
         pseudo_words_score      = VALUES(pseudo_words_score),
         total_score             = VALUES(total_score),
         percentage              = VALUES(percentage),
         performance_level       = VALUES(performance_level),
         total_time_seconds      = VALUES(total_time_seconds),
         avg_time_per_word       = VALUES(avg_time_per_word),
         error_patterns          = VALUES(error_patterns),
         is_partial              = VALUES(is_partial),
         updated_at              = NOW()`,
      [
        _sessionUUID, _childId, _parentId, _childName, _childGrade,
        _similarWordsScore, _nonSimilarWordsScore, _pseudoWordsScore,
        _totalScore, totalWords, _percentage, _performanceLevel,
        _totalTimeSeconds, _avgTimePerWord, _errorPatterns, _isPartial,
      ]
    );

    let resultId = result.insertId;
    if (!resultId && _sessionUUID) {
      const [rows] = await db.execute(
        'SELECT id FROM task1_word_results WHERE session_uuid = ? LIMIT 1',
        [_sessionUUID]
      );
      if (rows.length) resultId = rows[0].id;
    }

    return res.json({ success: true, resultId });
  } catch (err) {
    console.error('task1/submit error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * PATCH /api/task1/submit/:id  — direct id-based update (legacy support)
 */
router.patch('/submit/:id', async (req, res) => {
  const { id } = req.params;
  const {
    sessionUUID, session_uuid,
    childName, child_name,
    childGrade, child_grade,
    similarWordsScore, similar_words_score,
    nonSimilarWordsScore, non_similar_words_score,
    pseudoWordsScore, pseudo_words_score,
    totalScore, total_score,
    percentage,
    performanceLevel, performance_level,
    totalTimeSeconds, total_time_seconds,
    avgTimePerWord, avg_time_per_word,
    errorPatterns, error_patterns,
    isPartial, is_partial,
  } = req.body;

  try {
    await db.execute(
      `UPDATE task1_word_results SET
         session_uuid            = COALESCE(?, session_uuid),
         child_name              = COALESCE(?, child_name),
         child_grade             = COALESCE(?, child_grade),
         similar_words_score     = ?,
         non_similar_words_score = ?,
         pseudo_words_score      = ?,
         total_score             = ?,
         percentage              = ?,
         performance_level       = ?,
         total_time_seconds      = ?,
         avg_time_per_word       = ?,
         error_patterns          = ?,
         is_partial              = ?,
         updated_at              = NOW()
       WHERE id = ?`,
      [
        sessionUUID || session_uuid || null,
        childName   || child_name   || null,
        childGrade  || child_grade  || null,
        similarWordsScore    ?? similar_words_score    ?? 0,
        nonSimilarWordsScore ?? non_similar_words_score ?? 0,
        pseudoWordsScore     ?? pseudo_words_score     ?? 0,
        totalScore           ?? total_score            ?? 0,
        percentage ?? 0,
        performanceLevel || performance_level || null,
        totalTimeSeconds ?? total_time_seconds ?? 0,
        avgTimePerWord   ?? avg_time_per_word  ?? 0,
        errorPatterns    || error_patterns     || null,
        (isPartial !== undefined ? isPartial : (is_partial ?? 0)) ? 1 : 0,
        id,
      ]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('task1/submit PATCH error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * GET /api/task1/results
 */
router.get('/results', async (req, res) => {
  const { childName, parentId, sessionUUID } = req.query;
  try {
    let sql, params;
    if (sessionUUID) {
      sql    = 'SELECT * FROM task1_word_results WHERE session_uuid = ? ORDER BY completed_at DESC';
      params = [sessionUUID];
    } else if (childName && parentId) {
      sql = `SELECT t.* FROM task1_word_results t
             JOIN child_info_sessions s ON s.session_uuid = t.session_uuid
             WHERE s.child_name = ? AND s.parent_id = ?
             ORDER BY t.completed_at DESC`;
      params = [childName, parentId];
    } else {
      return res.status(400).json({ success: false, error: 'Provide sessionUUID or childName+parentId.' });
    }
    const [rows] = await db.execute(sql, params);
    return res.json({ success: true, results: rows });
  } catch (err) {
    console.error('task1/results error:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;