const express = require('express');
const pool    = require('../db');
const { verifyToken, requireParent } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/children ─────────────────────────────────────────
// Returns all children belonging to the authenticated parent.
// FIX: was using req.user.parentId which is UNDEFINED because
//      generateToken stores the id under the key 'id', not 'parentId'.
//      Changed to req.user.id throughout this file.
router.get('/', requireParent, async (req, res) => {
    try {
        const parentId = req.user.id;   // FIX: was req.user.parentId → undefined

        const [children] = await pool.query(
            `SELECT id, full_name, grade, parent_id, dob, created_at
             FROM Child
             WHERE parent_id = ?
             ORDER BY full_name ASC`,
            [parentId]
        );

        res.json(children);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ error: 'Failed to fetch children' });
    }
});

// ── GET /api/children/:id ─────────────────────────────────────
// Returns a single child — only if it belongs to the caller's parent id.
router.get('/:id', requireParent, async (req, res) => {
    try {
        const { id }   = req.params;
        const parentId = req.user.id;   // FIX: was req.user.parentId

        const [children] = await pool.query(
            `SELECT id, full_name, grade, parent_id, dob, created_at
             FROM Child
             WHERE id = ? AND parent_id = ?`,
            [id, parentId]
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

// ── POST /api/children ────────────────────────────────────────
router.post('/', requireParent, async (req, res) => {
    try {
        const { full_name, grade, dob } = req.body;
        const parentId                  = req.user.id;   // FIX: was req.user.parentId

        if (!full_name || grade === undefined) {
            return res.status(400).json({ error: 'full_name and grade are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO Child (full_name, grade, parent_id, dob) VALUES (?, ?, ?, ?)',
            [full_name.trim(), parseInt(grade), parentId, dob || null]
        );

        res.status(201).json({
            id:        result.insertId,
            full_name: full_name.trim(),
            grade:     parseInt(grade),
            parent_id: parentId,
            dob:       dob || null,
            message:   'Child created successfully',
        });
    } catch (error) {
        console.error('Error creating child:', error);
        res.status(500).json({ error: 'Failed to create child' });
    }
});

// ── PUT /api/children/:id ─────────────────────────────────────
// Only the parent who owns the child can update.
router.put('/:id', requireParent, async (req, res) => {
    try {
        const { id }          = req.params;
        const { full_name, grade, dob } = req.body;
        const parentId        = req.user.id;   // FIX: was req.user.parentId

        if (!full_name || grade === undefined) {
            return res.status(400).json({ error: 'full_name and grade are required' });
        }

        const [result] = await pool.query(
            'UPDATE Child SET full_name = ?, grade = ?, dob = ? WHERE id = ? AND parent_id = ?',
            [full_name.trim(), parseInt(grade), dob || null, id, parentId]
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

// ── DELETE /api/children/:id ──────────────────────────────────
// Only the parent who owns the child can delete.
router.delete('/:id', requireParent, async (req, res) => {
    try {
        const { id }   = req.params;
        const parentId = req.user.id;   // FIX: was req.user.parentId

        const [result] = await pool.query(
            'DELETE FROM Child WHERE id = ? AND parent_id = ?',
            [id, parentId]
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