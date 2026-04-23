const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const { generateToken, requireParent, requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/parents/register ────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const normalEmail = email.trim().toLowerCase();

        const [existing] = await pool.query(
            'SELECT id FROM Parent WHERE LOWER(email) = ?',
            [normalEmail]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            'INSERT INTO Parent (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
            [full_name.trim(), normalEmail, phone?.trim() || null, password_hash]
        );

        const token = generateToken({
            id:    result.insertId,
            role:  'parent',
            email: normalEmail,
            name:  full_name.trim(),
        });

        res.status(201).json({
            token,
            userId:   result.insertId,
            email:    normalEmail,
            name:     full_name.trim(),
            role:     'parent',
            message:  'Registered successfully',
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// ── POST /api/parents/login ───────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalEmail = email.trim().toLowerCase();

        const [rows] = await pool.query(
            `SELECT id, full_name, email, password_hash, assessment_completed
             FROM Parent
             WHERE LOWER(email) = ?`,
            [normalEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const parent = rows[0];
        const match  = await bcrypt.compare(password, parent.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
        pool.query(
            'UPDATE Parent SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
            [ipAddress, parent.id]
        ).catch(e => console.error('Parent login stat update error:', e.message));

        const token = generateToken({
            id:    parent.id,
            role:  'parent',
            email: parent.email,
            name:  parent.full_name,
        });

        res.json({
            token,
            userId:             parent.id,
            email:              parent.email,
            name:               parent.full_name,
            role:               'parent',
            assessmentCompleted: !!parent.assessment_completed,
            message:            'Login successful',
        });
    } catch (err) {
        console.error('Parent login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ── GET /api/parents/me ───────────────────────────────────────
router.get('/me', requireParent, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, full_name, email, phone,
                    assessment_completed, assessment_date,
                    can_access_activities, created_at
             FROM Parent
             WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('GET /parents/me error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ⚠️ NEW ROUTE ── GET /api/parents/me/results ───────────────────
// Returns all assessment summaries for the logged-in parent
router.get('/me/results', requireParent, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT f.*, s.created_at AS session_started_at
             FROM full_assessment_summary f
             JOIN child_info_sessions s ON s.session_uuid = f.session_uuid
             WHERE f.parent_id = ?
             ORDER BY f.completed_at DESC`,
            [req.user.id]
        );
        
        res.json({ success: true, results: rows });
    } catch (err) {
        console.error('GET /parents/me/results error:', err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// ── GET /api/parents/:id ──────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, full_name, email, phone,
                    assessment_completed, created_at
             FROM Parent
             WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('GET /parents/:id error:', err);
        res.status(500).json({ error: 'Failed to fetch parent' });
    }
});

// ── PUT /api/parents/:id ──────────────────────────────────────
router.put('/:id', requireParent, async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        if (!full_name) {
            return res.status(400).json({ error: 'full_name is required' });
        }

        if (parseInt(req.params.id) !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await pool.query(
            'UPDATE Parent SET full_name = ?, phone = ? WHERE id = ?',
            [full_name.trim(), phone?.trim() || null, req.params.id]
        );

        res.json({ message: 'Parent updated successfully' });
    } catch (err) {
        console.error('PUT /parents/:id error:', err);
        res.status(500).json({ error: 'Failed to update parent' });
    }
});

module.exports = router;