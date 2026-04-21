// routes/assessments.js
const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Optional auth — allows both logged-in and guest users
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) { req.user = null; return next(); }
  try {
    const jwt = require('jsonwebtoken');
    req.user  = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'dyslexia_jwt_secret_change_in_production');
  } catch { req.user = null; }
  next();
}

// =============================================================
// PUBLIC ROUTES
// =============================================================

// GET /api/assessments/words  — word lists for Task 1
router.get('/words', async (req, res) => {
  try {
    const [similar]    = await pool.query('SELECT word_text FROM reading_words WHERE category = "similar"    ORDER BY display_order');
    const [nonSimilar] = await pool.query('SELECT word_text FROM reading_words WHERE category = "non_similar" ORDER BY display_order');
    const [pseudo]     = await pool.query('SELECT word_text FROM reading_words WHERE category = "pseudo"     ORDER BY display_order');
    res.json({
      success: true,
      words: {
        similar:    similar.map(w => w.word_text),
        nonSimilar: nonSimilar.map(w => w.word_text),
        pseudo:     pseudo.map(w => w.word_text)
      }
    });
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// GET /api/assessments/passage  — reading passage for Task 2
router.get('/passage', async (req, res) => {
  try {
    const [passage] = await pool.query('SELECT title, content, word_count FROM reading_texts LIMIT 1');
    res.json({ success: true, passage: passage[0] || null });
  } catch (err) {
    console.error('Error fetching passage:', err);
    res.status(500).json({ error: 'Failed to fetch passage' });
  }
});

// ─────────────────────────────────────────────────────────────
// TASK 1  (word reading)
// POST /api/assessments/task1/submit  — handled by taskResults.js
// We keep these here only for stats/history views
// ─────────────────────────────────────────────────────────────

// GET /api/assessments/task1/results  (LOGIN REQUIRED)
router.get('/task1/results', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'therapist') {
      query  = `SELECT r.*, p.full_name as parent_name, p.email as parent_email
                FROM task1_word_results r
                LEFT JOIN parent p ON r.parent_id = p.id
                ORDER BY r.completed_at DESC LIMIT 100`;
      params = [];
    } else {
      query  = `SELECT r.* FROM task1_word_results r
                WHERE r.parent_id = ? OR r.child_id IN (SELECT id FROM Child WHERE parent_id = ?)
                ORDER BY r.completed_at DESC`;
      params = [req.user.id, req.user.id];
    }
    const [results] = await pool.query(query, params);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error fetching Task 1 results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ─────────────────────────────────────────────────────────────
// TASK 2  (passage reading)
// ─────────────────────────────────────────────────────────────

// POST /api/assessments/task2/submit  — create new row (PUBLIC)
router.post('/task2/submit', optionalAuth, async (req, res) => {
  try {
    const {
      childName, childGrade, childId,
      passageTitle, totalWords, correctWords,
      errorCount, timeUsedSeconds, maxTimeSeconds,
      errorDetails, is_partial
    } = req.body;

    if (!childName || !childGrade) {
      return res.status(400).json({ error: 'Child name and grade are required' });
    }

    const totalW     = totalWords || allWords(passageTitle);
    const pct        = totalW > 0 ? Math.round((correctWords / totalW) * 100) : 0;
    const wpm        = timeUsedSeconds > 0 ? Math.round((correctWords / timeUsedSeconds) * 60) : 0;
    const finishEarly = (timeUsedSeconds || 0) < (maxTimeSeconds || 180);

    let fluencyLevel = 'Building';
    if      (pct >= 90 && timeUsedSeconds <= 120) fluencyLevel = 'Excellent';
    else if (pct >= 80 && timeUsedSeconds <= 150) fluencyLevel = 'Good';
    else if (pct >= 70)                           fluencyLevel = 'Developing';

    const parent_id = req.user?.role === 'parent' ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO task2_results
         (child_name, child_grade, child_id, parent_id,
          passage_title, total_words, correct_words, error_count,
          percentage, fluency_level, reading_speed_wpm,
          time_used_seconds, max_time_seconds, finished_early,
          error_details, is_partial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        childName, childGrade, childId || null, parent_id,
        passageTitle || 'The Teacher',
        totalW, correctWords || 0, errorCount || 0,
        pct, fluencyLevel, wpm,
        timeUsedSeconds || 0, maxTimeSeconds || 180, finishEarly ? 1 : 0,
        JSON.stringify(errorDetails || []),
        is_partial ? 1 : 0
      ]
    );

    console.log(`✅ Task 2 saved! ID: ${result.insertId}`);

    res.json({
      success:         true,
      resultId:        result.insertId,
      totalWords:      totalW,
      correctWords:    correctWords,
      percentage:      pct,
      fluencyLevel,
      readingSpeedWpm: wpm
    });

  } catch (err) {
    console.error('❌ Task 2 submit error:', err);
    res.status(500).json({ error: 'Failed to save Task 2 results: ' + err.message });
  }
});

// PUT /api/assessments/task2/submit/:id  — update existing row (PUBLIC, for pause → resume)
router.put('/task2/submit/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      correctWords, errorCount, timeUsedSeconds,
      maxTimeSeconds, errorDetails, is_partial
    } = req.body;

    // Fetch total_words from existing row to recalculate percentage
    const [[existing]] = await pool.query(
      'SELECT total_words FROM task2_results WHERE id = ?', [id]
    );
    if (!existing) return res.status(404).json({ error: 'Result not found' });

    const totalW      = existing.total_words;
    const pct         = totalW > 0 ? Math.round(((correctWords || 0) / totalW) * 100) : 0;
    const wpm         = (timeUsedSeconds || 0) > 0 ? Math.round(((correctWords || 0) / timeUsedSeconds) * 60) : 0;
    const finishEarly = (timeUsedSeconds || 0) < (maxTimeSeconds || 180);

    let fluencyLevel = 'Building';
    if      (pct >= 90 && (timeUsedSeconds || 0) <= 120) fluencyLevel = 'Excellent';
    else if (pct >= 80 && (timeUsedSeconds || 0) <= 150) fluencyLevel = 'Good';
    else if (pct >= 70)                                  fluencyLevel = 'Developing';

    await pool.query(
      `UPDATE task2_results
       SET correct_words       = ?,
           error_count         = ?,
           percentage          = ?,
           fluency_level       = ?,
           reading_speed_wpm   = ?,
           time_used_seconds   = ?,
           finished_early      = ?,
           error_details       = ?,
           is_partial          = ?,
           updated_at          = NOW()
       WHERE id = ?`,
      [
        correctWords || 0, errorCount || 0,
        pct, fluencyLevel, wpm,
        timeUsedSeconds || 0, finishEarly ? 1 : 0,
        JSON.stringify(errorDetails || []),
        is_partial ? 1 : 0,
        id
      ]
    );

    res.json({
      success:         true,
      resultId:        parseInt(id),
      percentage:      pct,
      fluencyLevel,
      readingSpeedWpm: wpm
    });

  } catch (err) {
    console.error('❌ Task 2 update error:', err);
    res.status(500).json({ error: 'Failed to update Task 2 results: ' + err.message });
  }
});

// GET /api/assessments/task2/results  (LOGIN REQUIRED)
router.get('/task2/results', verifyToken, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'therapist') {
      query  = `SELECT r.*, p.full_name as parent_name, p.email as parent_email
                FROM task2_results r
                LEFT JOIN parent p ON r.parent_id = p.id
                ORDER BY r.completed_at DESC LIMIT 100`;
      params = [];
    } else {
      query  = `SELECT r.* FROM task2_results r
                WHERE r.parent_id = ? OR r.child_id IN (SELECT id FROM Child WHERE parent_id = ?)
                ORDER BY r.completed_at DESC`;
      params = [req.user.id, req.user.id];
    }
    const [results] = await pool.query(query, params);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error fetching Task 2 results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /api/assessments/stats  (THERAPIST ONLY)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') return res.status(403).json({ error: 'Therapists only.' });

    const [t1] = await pool.query(`
      SELECT COUNT(*) as total_submissions,
             AVG(percentage) as avg_percentage,
             SUM(CASE WHEN performance_level = 'Excellent'         THEN 1 ELSE 0 END) as excellent,
             SUM(CASE WHEN performance_level = 'Good'              THEN 1 ELSE 0 END) as good,
             SUM(CASE WHEN performance_level = 'Satisfactory'      THEN 1 ELSE 0 END) as satisfactory,
             SUM(CASE WHEN performance_level = 'Needs Improvement' THEN 1 ELSE 0 END) as needs_improvement,
             SUM(CASE WHEN is_partial = 0                          THEN 1 ELSE 0 END) as completed
      FROM task1_word_results
    `);

    const [t2] = await pool.query(`
      SELECT COUNT(*) as total_submissions,
             AVG(percentage) as avg_percentage,
             SUM(CASE WHEN fluency_level = 'Excellent'  THEN 1 ELSE 0 END) as excellent,
             SUM(CASE WHEN fluency_level = 'Good'       THEN 1 ELSE 0 END) as good,
             SUM(CASE WHEN fluency_level = 'Developing' THEN 1 ELSE 0 END) as developing,
             SUM(CASE WHEN fluency_level = 'Building'   THEN 1 ELSE 0 END) as building,
             SUM(CASE WHEN is_partial = 0               THEN 1 ELSE 0 END) as completed
      FROM task2_results
    `);

    res.json({ success: true, task1: t1[0], task2: t2[0] });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Compatibility routes (existing assessment system)
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const [assessments] = await pool.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes,
              ar.letter_recognition_score, ar.word_reading_score,
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.child_id = ?
       ORDER BY a.assessment_date DESC`,
      [req.params.childId]
    );
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [assessments] = await pool.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes,
              ar.letter_recognition_score, ar.word_reading_score,
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!assessments.length) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessments[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

module.exports = router;