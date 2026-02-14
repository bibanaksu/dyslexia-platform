const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all children for a parent (protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const parentId = req.user.parentId;
    const connection = await pool.getConnection();

    const [children] = await connection.query(
      'SELECT id, full_name, grade, parent_id, created_at FROM Child WHERE parent_id = ?',
      [parentId]
    );

    connection.release();
    res.json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// Get specific child (protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [children] = await connection.query(
      'SELECT id, full_name, grade, parent_id, created_at FROM Child WHERE id = ?',
      [id]
    );

    connection.release();

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json(children[0]);
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ error: 'Failed to fetch child' });
  }
});

// Create a new child (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { full_name, grade } = req.body;
    const parentId = req.user.parentId;

    if (!full_name || grade === undefined) {
      return res.status(400).json({ error: 'Name and grade are required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO Child (full_name, grade, parent_id) VALUES (?, ?, ?)',
      [full_name, grade, parentId]
    );

    connection.release();

    res.status(201).json({
      id: result.insertId,
      full_name,
      grade,
      parent_id: parentId,
      message: 'Child created successfully'
    });
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

// Update child details (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, grade } = req.body;

    if (!full_name || grade === undefined) {
      return res.status(400).json({ error: 'Name and grade are required' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE Child SET full_name = ?, grade = ? WHERE id = ?',
      [full_name, grade, id]
    );

    connection.release();

    res.json({ message: 'Child updated successfully' });
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({ error: 'Failed to update child' });
  }
});

// Delete child (protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM Child WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

module.exports = router;
