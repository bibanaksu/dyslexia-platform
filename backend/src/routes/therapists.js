const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');

// POST /api/therapists/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, email, password_hash FROM Therapist WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const therapist = rows[0];
    const passwordMatch = await bcrypt.compare(password, therapist.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: therapist.id,
      role: 'therapist',
      email: therapist.email,
      name: therapist.username
    });

    res.json({
      token,
      therapistId: therapist.id,
      email: therapist.email,
      role: 'therapist',
      name: therapist.username,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Therapist login error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /api/therapists/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM Therapist WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      'INSERT INTO Therapist (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );

    const therapistId = result.insertId;

    const token = generateToken({
      id: therapistId,
      role: 'therapist',
      email,
      name: username
    });

    res.status(201).json({
      token,
      therapistId,
      email,
      role: 'therapist',
      message: 'Registered successfully'
    });
  } catch (err) {
    console.error('Therapist register error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /api/therapists/me  (protected — get current therapist profile)
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Therapist access required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, email, created_at FROM Therapist WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Therapist me error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;