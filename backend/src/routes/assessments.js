const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all assessments for a child (protected)
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const connection = await pool.getConnection();

    const [assessments] = await connection.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes, 
              ar.letter_recognition_score, ar.word_reading_score, 
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.child_id = ?
       ORDER BY a.assessment_date DESC`,
      [childId]
    );

    connection.release();
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Get specific assessment (protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [assessments] = await connection.query(
      `SELECT a.id, a.child_id, a.assessment_date, a.notes,
              ar.letter_recognition_score, ar.word_reading_score,
              ar.comprehension_score, ar.overall_evaluation
       FROM Assessment a
       LEFT JOIN AssessmentResults ar ON a.id = ar.assessment_id
       WHERE a.id = ?`,
      [id]
    );

    connection.release();

    if (assessments.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessments[0]);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Create assessment with results (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      child_id,
      assessment_date,
      notes,
      letter_recognition_score,
      word_reading_score,
      comprehension_score,
      overall_evaluation
    } = req.body;

    if (!child_id || !assessment_date) {
      return res.status(400).json({ error: 'child_id and assessment_date are required' });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create assessment
      const [assessmentResult] = await connection.query(
        'INSERT INTO Assessment (child_id, assessment_date, notes) VALUES (?, ?, ?)',
        [child_id, assessment_date, notes || null]
      );

      const assessmentId = assessmentResult.insertId;

      // Create assessment results if scores provided
      if (letter_recognition_score !== undefined || word_reading_score !== undefined || comprehension_score !== undefined) {
        await connection.query(
          `INSERT INTO AssessmentResults 
           (assessment_id, letter_recognition_score, word_reading_score, comprehension_score, overall_evaluation)
           VALUES (?, ?, ?, ?, ?)`,
          [
            assessmentId,
            letter_recognition_score || null,
            word_reading_score || null,
            comprehension_score || null,
            overall_evaluation || null
          ]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        assessment_id: assessmentId,
        child_id,
        assessment_date,
        message: 'Assessment created successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment results (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      letter_recognition_score,
      word_reading_score,
      comprehension_score,
      overall_evaluation
    } = req.body;

    const connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT id FROM AssessmentResults WHERE assessment_id = ?',
      [id]
    );

    if (existing.length > 0) {
      // Update existing results
      await connection.query(
        `UPDATE AssessmentResults 
         SET letter_recognition_score = ?, word_reading_score = ?, 
             comprehension_score = ?, overall_evaluation = ?
         WHERE assessment_id = ?`,
        [
          letter_recognition_score || null,
          word_reading_score || null,
          comprehension_score || null,
          overall_evaluation || null,
          id
        ]
      );
    } else {
      // Insert new results
      await connection.query(
        `INSERT INTO AssessmentResults 
         (assessment_id, letter_recognition_score, word_reading_score, comprehension_score, overall_evaluation)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          letter_recognition_score || null,
          word_reading_score || null,
          comprehension_score || null,
          overall_evaluation || null
        ]
      );
    }

    connection.release();

    res.json({ message: 'Assessment results updated successfully' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

module.exports = router;
