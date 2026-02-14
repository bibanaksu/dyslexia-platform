const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all activities (protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [activities] = await connection.query(
      'SELECT id, name, description, difficulty_level, created_at FROM Activity ORDER BY difficulty_level ASC'
    );

    connection.release();
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get specific activity (protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [activities] = await connection.query(
      'SELECT id, name, description, difficulty_level, created_at FROM Activity WHERE id = ?',
      [id]
    );

    connection.release();

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activities[0]);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Create a new activity (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, difficulty_level } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Activity name is required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO Activity (name, description, difficulty_level) VALUES (?, ?, ?)',
      [name, description || null, difficulty_level || 1]
    );

    connection.release();

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      difficulty_level: difficulty_level || 1,
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update activity (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, difficulty_level } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Activity name is required' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE Activity SET name = ?, description = ?, difficulty_level = ? WHERE id = ?',
      [name, description || null, difficulty_level || 1, id]
    );

    connection.release();

    res.json({ message: 'Activity updated successfully' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Get child's activity progress (protected)
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const connection = await pool.getConnection();

    const [progress] = await connection.query(
      `SELECT cap.id, cap.child_id, cap.activity_id, a.name, a.description, a.difficulty_level,
              cap.completed, cap.completion_date, cap.progress_percentage, cap.last_accessed
       FROM ChildActivityProgress cap
       JOIN Activity a ON cap.activity_id = a.id
       WHERE cap.child_id = ?
       ORDER BY a.difficulty_level ASC`,
      [childId]
    );

    connection.release();
    res.json(progress);
  } catch (error) {
    console.error('Error fetching child activity progress:', error);
    res.status(500).json({ error: 'Failed to fetch activity progress' });
  }
});

// Create or update child activity progress (protected)
router.post('/track', verifyToken, async (req, res) => {
  try {
    const { child_id, activity_id, completed, completion_date, progress_percentage } = req.body;

    if (!child_id || !activity_id) {
      return res.status(400).json({ error: 'child_id and activity_id are required' });
    }

    const connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT id FROM ChildActivityProgress WHERE child_id = ? AND activity_id = ?',
      [child_id, activity_id]
    );

    if (existing.length > 0) {
      // Update existing progress
      await connection.query(
        `UPDATE ChildActivityProgress 
         SET completed = ?, completion_date = ?, progress_percentage = ?, last_accessed = NOW()
         WHERE child_id = ? AND activity_id = ?`,
        [
          completed || false,
          (completed ? completion_date : null) || null,
          progress_percentage || 0,
          child_id,
          activity_id
        ]
      );
    } else {
      // Insert new progress
      await connection.query(
        `INSERT INTO ChildActivityProgress 
         (child_id, activity_id, completed, completion_date, progress_percentage, last_accessed)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          child_id,
          activity_id,
          completed || false,
          (completed ? completion_date : null) || null,
          progress_percentage || 0
        ]
      );
    }

    connection.release();

    res.json({ message: 'Activity progress tracked successfully' });
  } catch (error) {
    console.error('Error tracking activity progress:', error);
    res.status(500).json({ error: 'Failed to track activity progress' });
  }
});

module.exports = router;
