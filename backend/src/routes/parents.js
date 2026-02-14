const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register a new parent
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const connection = await pool.getConnection();

    // Check if parent already exists
    const [existingParent] = await connection.query(
      'SELECT id FROM Parent WHERE email = ?',
      [email]
    );

    if (existingParent.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new parent
    const [result] = await connection.query(
      'INSERT INTO Parent (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, phone || null, password_hash]
    );

    connection.release();

    res.status(201).json({
      id: result.insertId,
      full_name,
      email,
      message: 'Parent registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register parent' });
  }
});

// Login parent
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [parents] = await connection.query(
      'SELECT id, password_hash FROM Parent WHERE email = ?',
      [email]
    );

    if (parents.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const parent = parents[0];
    const passwordMatch = await bcrypt.compare(password, parent.password_hash);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    connection.release();

    const token = generateToken(parent.id);
    res.json({
      token,
      parentId: parent.id,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get parent details (protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [parents] = await connection.query(
      'SELECT id, full_name, email, phone, created_at FROM Parent WHERE id = ?',
      [id]
    );

    connection.release();

    if (parents.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parents[0]);
  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ error: 'Failed to fetch parent' });
  }
});

// Update parent details (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE Parent SET full_name = ?, phone = ? WHERE id = ?',
      [full_name, phone || null, id]
    );

    connection.release();

    res.json({ message: 'Parent updated successfully' });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'Failed to update parent' });
  }
});

module.exports = router;
