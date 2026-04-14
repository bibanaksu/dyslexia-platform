const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Optional auth for guests (allows both logged-in and non-logged-in users)
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    const jwt = require('jsonwebtoken');
    req.user = jwt.verify(
      header.split(' ')[1],
      process.env.JWT_SECRET || 'dyslexia_jwt_secret_change_in_production'
    );
  } catch {
    req.user = null;
  }
  next();
}

// =============================================================
// PUBLIC ROUTES - No login required
// =============================================================

// GET /api/assessments/words - Get all words for Task 1 (PUBLIC)
router.get('/words', async (req, res) => {
  try {
    const [similarWords] = await pool.query(
      'SELECT word_text FROM reading_words WHERE category = "similar" ORDER BY display_order'
    );
    const [nonSimilarWords] = await pool.query(
      'SELECT word_text FROM reading_words WHERE category = "non_similar" ORDER BY display_order'
    );
    const [pseudoWords] = await pool.query(
      'SELECT word_text FROM reading_words WHERE category = "pseudo" ORDER BY display_order'
    );
    
    res.json({
      success: true,
      words: {
        similar: similarWords.map(w => w.word_text),
        nonSimilar: nonSimilarWords.map(w => w.word_text),
        pseudo: pseudoWords.map(w => w.word_text)
      }
    });
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// GET /api/assessments/passage - Get reading passage (PUBLIC)
router.get('/passage', async (req, res) => {
  try {
    const [passage] = await pool.query(
      'SELECT title, content, word_count FROM reading_texts LIMIT 1'
    );
    
    if (passage.length > 0) {
      res.json({ success: true, passage: passage[0] });
    } else {
      res.json({ success: true, passage: null });
    }
  } catch (err) {
    console.error('Error fetching passage:', err);
    res.status(500).json({ error: 'Failed to fetch passage' });
  }
});

// POST /api/assessments/task1/submit - Save Task 1 results (PUBLIC - guests allowed)
router.post('/task1/submit', optionalAuth, async (req, res) => {
  try {
    console.log('📝 Task 1 submission received');
    
    const {
      childName,
      childGrade,
      childId,
      similarWordsScore,
      nonSimilarWordsScore,
      pseudoWordsScore,
      totalTimeSeconds,
      errorPatterns
    } = req.body;

    if (!childName || !childGrade) {
      return res.status(400).json({ error: 'Child name and grade are required' });
    }

    const totalScore = (similarWordsScore || 0) + (nonSimilarWordsScore || 0) + (pseudoWordsScore || 0);
    const percentage = (totalScore / 60) * 100;
    
    let performanceLevel = 'Keep Practicing';
    if (percentage >= 85) performanceLevel = 'Excellent';
    else if (percentage >= 70) performanceLevel = 'Good';

    const avgTimePerWord = totalTimeSeconds ? totalTimeSeconds / 60 : 0;
    const parent_id = req.user?.id || null;

    const [result] = await pool.query(
      `INSERT INTO task1_results 
       (child_name, child_grade, child_id, parent_id,
        similar_words_score, non_similar_words_score, pseudo_words_score,
        total_score, percentage, performance_level,
        total_time_seconds, avg_time_per_word, error_patterns)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [childName, childGrade, childId || null, parent_id,
       similarWordsScore || 0, nonSimilarWordsScore || 0, pseudoWordsScore || 0,
       totalScore, percentage, performanceLevel,
       totalTimeSeconds || 0, avgTimePerWord, JSON.stringify(errorPatterns || {})]
    );

    console.log(`✅ Task 1 saved! ID: ${result.insertId}`);

    res.json({
      success: true,
      resultId: result.insertId,
      totalScore: totalScore,
      totalWords: 60,
      percentage: Math.round(percentage),
      performanceLevel: performanceLevel
    });

  } catch (err) {
    console.error('❌ Task 1 submit error:', err);
    res.status(500).json({ error: 'Failed to save Task 1 results: ' + err.message });
  }
});

// POST /api/assessments/task2/submit - Save Task 2 results (PUBLIC - guests allowed)
router.post('/task2/submit', optionalAuth, async (req, res) => {
  try {
    console.log('📖 Task 2 submission received');
    
    const {
      childName,
      childGrade,
      childId,
      passageTitle,
      totalWords,
      correctWords,
      errorCount,
      timeUsedSeconds,
      maxTimeSeconds,
      errorDetails
    } = req.body;

    if (!childName || !childGrade) {
      return res.status(400).json({ error: 'Child name and grade are required' });
    }

    const totalWordsCount = totalWords || 85;
    const percentage = (correctWords / totalWordsCount) * 100;
    const finishedEarly = timeUsedSeconds < (maxTimeSeconds || 180);
    
    let fluencyLevel = 'Building';
    const wpm = timeUsedSeconds > 0 ? (correctWords / timeUsedSeconds) * 60 : 0;
    
    if (percentage >= 90 && timeUsedSeconds <= 120) fluencyLevel = 'Excellent';
    else if (percentage >= 80 && timeUsedSeconds <= 150) fluencyLevel = 'Good';
    else if (percentage >= 70) fluencyLevel = 'Developing';

    const parent_id = req.user?.id || null;

    const [result] = await pool.query(
      `INSERT INTO task2_results 
       (child_name, child_grade, child_id, parent_id,
        passage_title, total_words, correct_words, error_count,
        percentage, fluency_level, reading_speed_wpm,
        time_used_seconds, max_time_seconds, finished_early, error_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [childName, childGrade, childId || null, parent_id,
       passageTitle || 'The Teacher', totalWordsCount, correctWords, errorCount || 0,
       percentage, fluencyLevel, wpm,
       timeUsedSeconds || 0, maxTimeSeconds || 180, finishedEarly, JSON.stringify(errorDetails || [])]
    );

    console.log(`✅ Task 2 saved! ID: ${result.insertId}`);

    res.json({
      success: true,
      resultId: result.insertId,
      totalWords: totalWordsCount,
      correctWords: correctWords,
      percentage: Math.round(percentage),
      fluencyLevel: fluencyLevel,
      readingSpeedWpm: Math.round(wpm)
    });

  } catch (err) {
    console.error('❌ Task 2 submit error:', err);
    res.status(500).json({ error: 'Failed to save Task 2 results: ' + err.message });
  }
});

// =============================================================
// PROTECTED ROUTES - Login required (for viewing history)
// =============================================================

// GET /api/assessments/task1/results - Get Task 1 results history (LOGIN REQUIRED)
router.get('/task1/results', verifyToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'therapist') {
      query = `
        SELECT r.*, p.full_name as parent_name, p.email as parent_email
        FROM task1_results r
        LEFT JOIN parent p ON r.parent_id = p.id
        ORDER BY r.completed_at DESC
        LIMIT 100
      `;
      params = [];
    } else {
      query = `
        SELECT r.*
        FROM task1_results r
        WHERE r.parent_id = ? OR r.child_id IN (SELECT id FROM Child WHERE parent_id = ?)
        ORDER BY r.completed_at DESC
      `;
      params = [req.user.id, req.user.id];
    }

    const [results] = await pool.query(query, params);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error fetching Task 1 results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /api/assessments/task2/results - Get Task 2 results history (LOGIN REQUIRED)
router.get('/task2/results', verifyToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'therapist') {
      query = `
        SELECT r.*, p.full_name as parent_name, p.email as parent_email
        FROM task2_results r
        LEFT JOIN parent p ON r.parent_id = p.id
        ORDER BY r.completed_at DESC
        LIMIT 100
      `;
      params = [];
    } else {
      query = `
        SELECT r.*
        FROM task2_results r
        WHERE r.parent_id = ? OR r.child_id IN (SELECT id FROM Child WHERE parent_id = ?)
        ORDER BY r.completed_at DESC
      `;
      params = [req.user.id, req.user.id];
    }

    const [results] = await pool.query(query, params);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error fetching Task 2 results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /api/assessments/stats - Get statistics (THERAPIST ONLY)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Access denied. Therapists only.' });
    }

    const [task1Stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        AVG(percentage) as avg_percentage,
        SUM(CASE WHEN performance_level = 'Excellent' THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN performance_level = 'Good' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN performance_level = 'Keep Practicing' THEN 1 ELSE 0 END) as practicing
      FROM task1_results
    `);

    const [task2Stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        AVG(percentage) as avg_percentage,
        SUM(CASE WHEN fluency_level = 'Excellent' THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN fluency_level = 'Good' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN fluency_level = 'Developing' THEN 1 ELSE 0 END) as developing,
        SUM(CASE WHEN fluency_level = 'Building' THEN 1 ELSE 0 END) as building
      FROM task2_results
    `);

    res.json({ success: true, task1: task1Stats[0], task2: task2Stats[0] });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Keep existing routes for compatibility
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const [assessments] = await pool.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes,
              ar.letter_recognition_score, ar.word_reading_score,
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.child_id = ?
       ORDER BY a.assessment_date DESC`,
      [childId]
    );
    res.json(assessments);
  } catch (err) {
    console.error('Error fetching assessments:', err);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [assessments] = await pool.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes,
              ar.letter_recognition_score, ar.word_reading_score,
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.id = ?`,
      [id]
    );
    if (assessments.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json(assessments[0]);
  } catch (err) {
    console.error('Error fetching assessment:', err);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

module.exports = router;