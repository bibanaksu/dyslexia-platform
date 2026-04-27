// backend/src/routes/parents.js
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateToken, verifyToken, requireParent, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/parents/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, password, child_session_id, child_name } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (!child_session_id) {
            return res.status(400).json({ error: 'child_session_id is required' });
        }
        if (!child_name) {
            return res.status(400).json({ error: 'Child name is required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const normalEmail = email.trim().toLowerCase();

        const [existingParent] = await pool.query('SELECT id FROM parent WHERE LOWER(email) = ?', [normalEmail]);

        const [[session]] = await pool.query(
            'SELECT child_name, child_grade FROM child_session WHERE id = ?',
            [child_session_id]
        );
        if (!session) {
            return res.status(404).json({ error: 'Child session not found' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let parent_id;
            if (existingParent.length > 0) {
                parent_id = existingParent[0].id;
                const [existingChild] = await connection.query(
                    'SELECT id FROM child WHERE parent_id = ? AND LOWER(full_name) = LOWER(?)',
                    [parent_id, child_name.trim()]
                );
                if (existingChild.length > 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'You already have a child with that name. Please use a different name.' });
                }
            } else {
                const [parentResult] = await connection.query(
                    'INSERT INTO parent (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
                    [full_name.trim(), normalEmail, phone?.trim() || null, password_hash]
                );
                parent_id = parentResult.insertId;
            }

            const [childResult] = await connection.query(
                'INSERT INTO child (parent_id, full_name, grade) VALUES (?, ?, ?)',
                [parent_id, child_name.trim(), session.child_grade]
            );
            const child_id = childResult.insertId;

            await connection.query(
                'UPDATE child_session SET parent_id = ?, child_id = ? WHERE id = ?',
                [parent_id, child_id, child_session_id]
            );
            await connection.query(
                'UPDATE parent_screening SET parent_id = ?, child_id = ? WHERE child_session_id = ?',
                [parent_id, child_id, child_session_id]
            );
            await connection.query(
                'UPDATE task1_word_results SET child_id = ? WHERE child_session_id = ?',
                [child_id, child_session_id]
            );
            await connection.query(
                'UPDATE task2_results SET child_id = ? WHERE child_session_id = ?',
                [child_id, child_session_id]
            );
            await connection.query(
                'UPDATE task3_letter_similarity_results SET child_id = ? WHERE child_session_id = ?',
                [child_id, child_session_id]
            );
            await connection.query(
                'UPDATE task4_number_memory_results SET child_id = ? WHERE child_session_id = ?',
                [child_id, child_session_id]
            );
            await connection.query(
                'UPDATE full_assessment_summary SET child_id = ?, parent_id = ? WHERE child_session_id = ?',
                [child_id, parent_id, child_session_id]
            );

            await connection.commit();

            const token = generateToken({
                id: parent_id,
                role: 'parent',
                email: normalEmail,
                name: full_name.trim(),
            });

            res.status(201).json({
                token,
                userId: parent_id,
                email: normalEmail,
                name: full_name.trim(),
                role: 'parent',
                child_id: child_id,
                message: existingParent.length > 0 ? 'Child added successfully to existing account' : 'Registered successfully',
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Failed to register: ' + err.message });
    }
});

// POST /api/parents/add-child
router.post('/add-child', verifyToken, requireParent, async (req, res) => {
    try {
        const { child_name, child_grade } = req.body;
        const parent_id = req.user.id;

        if (!child_name || !child_grade) {
            return res.status(400).json({ error: 'child_name and child_grade are required' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [sessionResult] = await connection.query(
                'INSERT INTO child_session (child_name, child_grade) VALUES (?, ?)',
                [child_name.trim(), parseInt(child_grade)]
            );
            const child_session_id = sessionResult.insertId;

            const [childResult] = await connection.query(
                'INSERT INTO child (parent_id, full_name, grade) VALUES (?, ?, ?)',
                [parent_id, child_name.trim(), parseInt(child_grade)]
            );
            const child_id = childResult.insertId;

            await connection.query(
                'UPDATE child_session SET parent_id = ?, child_id = ? WHERE id = ?',
                [parent_id, child_id, child_session_id]
            );

            await connection.commit();

            res.json({
                success: true,
                child_session_id,
                child_id,
                message: 'Child added successfully',
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Add child error:', err);
        res.status(500).json({ error: 'Failed to add child: ' + err.message });
    }
});

// GET /api/parents/me (parent's own profile)
router.get('/me', verifyToken, requireParent, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, full_name, email, phone, created_at FROM parent WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Parent not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /parents/me error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET /api/parents/me/children
router.get('/me/children', verifyToken, requireParent, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, full_name, grade, dob, created_at FROM child WHERE parent_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /parents/me/children error:', err);
        res.status(500).json({ error: 'Failed to fetch children' });
    }
});

// GET /api/parents/me/results
router.get('/me/results', verifyToken, requireParent, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.id AS child_id, c.full_name AS child_name, c.grade,
                    fas.*, cs.created_at AS session_started_at
             FROM child c
             JOIN child_session cs ON cs.child_id = c.id
             JOIN full_assessment_summary fas ON fas.child_session_id = cs.id
             WHERE c.parent_id = ?
             ORDER BY fas.completed_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, results: rows });
    } catch (err) {
        console.error('GET /parents/me/results error:', err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// GET /api/parents/:id (any parent by ID – requires auth)
router.get('/:id', verifyToken, requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, full_name, email, phone, created_at FROM parent WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Parent not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /parents/:id error:', err);
        res.status(500).json({ error: 'Failed to fetch parent' });
    }
});

// PUT /api/parents/:id
router.put('/:id', verifyToken, requireParent, async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        if (!full_name) return res.status(400).json({ error: 'full_name is required' });
        if (parseInt(req.params.id) !== req.user.id) return res.status(403).json({ error: 'Access denied' });
        await pool.query(
            'UPDATE parent SET full_name = ?, phone = ? WHERE id = ?',
            [full_name.trim(), phone?.trim() || null, req.params.id]
        );
        res.json({ message: 'Parent updated successfully' });
    } catch (err) {
        console.error('PUT /parents/:id error:', err);
        res.status(500).json({ error: 'Failed to update parent' });
    }
});

module.exports = router;