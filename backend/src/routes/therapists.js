const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, requireTherapist } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// POST /api/therapists/login
// ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Therapist login attempt:', email);

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
        const match = await bcrypt.compare(password, therapist.password_hash);

        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        if (!match) {
            // Log failed login attempt
            await pool.query(
                'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                [therapist.id, 'therapist', 'login_failure', ipAddress, userAgent]
            );
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update login stats
        await pool.query(
            'UPDATE Therapist SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
            [ipAddress, therapist.id]
        );

        // Log successful login
        await pool.query(
            'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [therapist.id, 'therapist', 'login_success', ipAddress, userAgent]
        );

        // ✅ Re-fetch AFTER the UPDATE to get the fresh login_count & last_login
        const [updated] = await pool.query(
            'SELECT login_count, last_login FROM Therapist WHERE id = ?',
            [therapist.id]
        );

        const token = generateToken({
            id: therapist.id,
            role: 'therapist',
            email: therapist.email,
            name: therapist.username,
        });

        res.json({
            token,
            userId: therapist.id,          // ✅ Fixed: was 'therapistId'
            email: therapist.email,
            role: 'therapist',
            name: therapist.username,
            loginCount: updated[0].login_count,
            lastLogin: updated[0].last_login,
            message: 'Login successful',
        });

    } catch (err) {
        console.error('Therapist login error:', err);
        res.status(500).json({ error: 'Failed to login', details: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// POST /api/therapists/register
// ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM Therapist WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check if username already exists
        const [existingUsername] = await pool.query('SELECT id FROM Therapist WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            'INSERT INTO Therapist (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );

        const token = generateToken({
            id: result.insertId,
            role: 'therapist',
            email,
            name: username,
        });

        // ✅ Fixed registration response
        res.status(201).json({
            token,
            userId: result.insertId,     // ✅ Fixed: was 'therapistId'
            email: email,
            role: 'therapist',
            name: username,
            message: 'Registered successfully',
        });

    } catch (err) {
        console.error('Therapist registration error:', err);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// ──────────────────────────────────────────────────────────────
// GET /api/therapists/audit-log  (protected — therapists only)
// ──────────────────────────────────────────────────────────────
router.get('/audit-log', requireTherapist, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, user_id, user_role, event_type, ip_address,
                    LEFT(user_agent, 100) AS user_agent, created_at
             FROM AuditLog
             ORDER BY created_at DESC
             LIMIT 100`
        );
        res.json(rows);
    } catch (err) {
        console.error('Audit log error:', err);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

module.exports = router;