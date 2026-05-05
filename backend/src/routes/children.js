const express = require('express');
const pool = require('../db');
const { verifyToken, requireParent } = require('../middleware/auth');

const router = express.Router();

// GET /api/children – add verifyToken before requireParent
router.get('/', verifyToken, requireParent, async (req, res) => {
    try {
        const [children] = await pool.query(
            `SELECT id, full_name, grade, parent_id, dob, created_at
             FROM child
             WHERE parent_id = ?
             ORDER BY full_name ASC`,
            [req.user.id]
        );
        res.json(children);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ error: 'Failed to fetch children' });
    }
});

// GET /api/children/:id
router.get('/:id', verifyToken, requireParent, async (req, res) => {
    try {
        const { id } = req.params;
        const [children] = await pool.query(
            `SELECT id, full_name, grade, parent_id, dob, created_at
             FROM child
             WHERE id = ? AND parent_id = ?`,
            [id, req.user.id]
        );

        if (children.length === 0) {
            return res.status(404).json({ error: 'Child not found' });
        }

        res.json(children[0]);
    } catch (error) {
        console.error('Error fetching child:', error);
        res.status(500).json({ error: 'Failed to fetch child' });
    }
});

// POST /api/children – ADD CHILD
router.post('/', verifyToken, requireParent, async (req, res) => {
    try {
        const { full_name, grade, dob } = req.body;
        if (!full_name || grade === undefined) {
            return res.status(400).json({ error: 'full_name and grade are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO child (parent_id, full_name, grade, dob) VALUES (?, ?, ?, ?)',
            [req.user.id, full_name.trim(), parseInt(grade), dob || null]
        );
        res.status(201).json({
            id: result.insertId,
            full_name: full_name.trim(),
            grade: parseInt(grade),
            dob: dob || null,
            parent_id: req.user.id
        });
    } catch (error) {
        console.error('Error adding child:', error);
        res.status(500).json({ error: 'Failed to add child' });
    }
});

// PUT /api/children/:id
router.put('/:id', verifyToken, requireParent, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, grade, dob } = req.body;

        if (!full_name || grade === undefined) {
            return res.status(400).json({ error: 'full_name and grade are required' });
        }

        const [result] = await pool.query(
            'UPDATE child SET full_name = ?, grade = ?, dob = ? WHERE id = ? AND parent_id = ?',
            [full_name.trim(), parseInt(grade), dob || null, id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Child not found or access denied' });
        }

        res.json({ message: 'Child updated successfully' });
    } catch (error) {
        console.error('Error updating child:', error);
        res.status(500).json({ error: 'Failed to update child' });
    }
});

// DELETE /api/children/:id
router.delete('/:id', verifyToken, requireParent, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'DELETE FROM child WHERE id = ? AND parent_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Child not found or access denied' });
        }

        res.json({ message: 'Child deleted successfully' });
    } catch (error) {
        console.error('Error deleting child:', error);
        res.status(500).json({ error: 'Failed to delete child' });
    }
});

module.exports = router;
// GET /api/children/:id/assignments — get activities assigned to a child (parent access)
router.get('/:id/assignments', verifyToken, requireParent, async (req, res) => {
    try {
        const childId = req.params.id;

        // Security: make sure this child belongs to the requesting parent
        const [check] = await pool.query(
            'SELECT id FROM child WHERE id = ? AND parent_id = ?',
            [childId, req.user.id]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [rows] = await pool.query(`
            SELECT cap.id, cap.child_id, cap.activity_id, cap.completed, cap.score, cap.created_at,
                   a.name, a.name AS activity_name, a.type, a.description, a.difficulty_level
            FROM child_activity_progress cap
            JOIN activity a ON a.id = cap.activity_id
            WHERE cap.child_id = ?
            ORDER BY cap.created_at DESC
        `, [childId]);

        res.json({ assignments: rows });
    } catch (err) {
        console.error('GET /children/:id/assignments error:', err);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});