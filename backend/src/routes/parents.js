const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, requireParent, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/parents/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const [existing] = await pool.query('SELECT id FROM Parent WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO Parent (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, phone || null, password_hash]
    );

    const token = generateToken({ id: result.insertId, role: 'parent', email, name: full_name });
    res.status(201).json({ token, parentId: result.insertId, full_name, email, role: 'parent', message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /api/parents/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, assessment_completed FROM Parent WHERE email = ?',
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const parent = rows[0];
    const match = await bcrypt.compare(password, parent.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken({ id: parent.id, role: 'parent', email: parent.email, name: parent.full_name });
    res.json({
      token,
      parentId: parent.id,
      full_name: parent.full_name,
      email: parent.email,
      role: 'parent',
      assessmentCompleted: !!parent.assessment_completed,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/parents/me  (protected - parent)
router.get('/me', requireParent, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, assessment_completed, assessment_date, can_access_activities, created_at FROM Parent WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Parent not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/parents/:id  (protected)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, assessment_completed, created_at FROM Parent WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Parent not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parent' });
  }
});

// PUT /api/parents/:id  (protected)
router.put('/:id', requireParent, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Name is required' });
    await pool.query('UPDATE Parent SET full_name = ?, phone = ? WHERE id = ?',
      [full_name, phone || null, req.params.id]);
    res.json({ message: 'Parent updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update parent' });
  }
});

module.exports = router;
