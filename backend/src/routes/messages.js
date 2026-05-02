// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/messages
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'parent') {
            // Parent sees all messages they are part of
            query = `
                SELECT m.*, 
                       p.full_name as parent_name,
                       t.username as therapist_name,
                       c.full_name as child_name
                FROM message m
                LEFT JOIN parent p ON m.parent_id = p.id
                LEFT JOIN therapist t ON m.therapist_id = t.id
                LEFT JOIN child c ON m.child_id = c.id
                WHERE m.parent_id = ?
                ORDER BY m.created_at ASC
            `;
            params = [req.user.id];
        } else if (req.user.role === 'therapist') {
            // Therapist can filter by parentId if provided
            const parentId = req.query.parentId;
            query = `
                SELECT m.*, 
                       p.full_name as parent_name,
                       t.username as therapist_name,
                       c.full_name as child_name
                FROM message m
                LEFT JOIN parent p ON m.parent_id = p.id
                LEFT JOIN therapist t ON m.therapist_id = t.id
                LEFT JOIN child c ON m.child_id = c.id
                WHERE m.therapist_id = ?
                ${parentId ? 'AND m.parent_id = ?' : ''}
                ORDER BY m.created_at ASC
            `;
            params = parentId ? [req.user.id, parentId] : [req.user.id];
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }

        const [messages] = await pool.query(query, params);
        res.json({ messages });
    } catch (err) {
        console.error('GET /messages error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /api/messages
router.post('/', verifyToken, async (req, res) => {
    try {
        const { content, parentId, child_id } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        let parent_id, therapist_id;

        if (req.user.role === 'parent') {
            parent_id = req.user.id;
            // Get assigned therapist for this parent
            const [[parent]] = await pool.query(
                'SELECT assigned_therapist_id FROM parent WHERE id = ?',
                [parent_id]
            );
            therapist_id = parent?.assigned_therapist_id;
            if (!therapist_id) {
                return res.status(400).json({ error: 'No therapist assigned to this parent' });
            }
        } else if (req.user.role === 'therapist') {
            therapist_id = req.user.id;
            parent_id = parentId;   // Therapist must provide parentId in request body
            if (!parent_id) {
                return res.status(400).json({ error: 'parentId is required for therapist messages' });
            }
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }

        if (!parent_id || !therapist_id) {
            return res.status(400).json({ error: 'Missing conversation participants' });
        }

        const [result] = await pool.query(
            `INSERT INTO message (parent_id, therapist_id, child_id, sender_role, content)
             VALUES (?, ?, ?, ?, ?)`,
            [parent_id, therapist_id, child_id || null, req.user.role, content.trim()]
        );

        const [[message]] = await pool.query(
            `SELECT m.*, 
                    p.full_name as parent_name,
                    t.username as therapist_name,
                    c.full_name as child_name
             FROM message m
             LEFT JOIN parent p ON m.parent_id = p.id
             LEFT JOIN therapist t ON m.therapist_id = t.id
             LEFT JOIN child c ON m.child_id = c.id
             WHERE m.id = ?`,
            [result.insertId]
        );

        res.json({ message });
    } catch (err) {
        console.error('POST /messages error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET /api/messages/unread-count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        let query, params;
        if (req.user.role === 'parent') {
            query = `SELECT COUNT(*) as count FROM message WHERE parent_id = ? AND is_read = FALSE AND sender_role = 'therapist'`;
            params = [req.user.id];
        } else if (req.user.role === 'therapist') {
            query = `SELECT COUNT(*) as count FROM message WHERE therapist_id = ? AND is_read = FALSE AND sender_role = 'parent'`;
            params = [req.user.id];
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const [rows] = await pool.query(query, params);
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error('GET /messages/unread-count error:', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// PUT /api/messages/:id/read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const messageId = req.params.id;
        let query, params;

        if (req.user.role === 'parent') {
            query = `UPDATE message SET is_read = TRUE WHERE id = ? AND parent_id = ?`;
            params = [messageId, req.user.id];
        } else if (req.user.role === 'therapist') {
            query = `UPDATE message SET is_read = TRUE WHERE id = ? AND therapist_id = ?`;
            params = [messageId, req.user.id];
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Message not found or access denied' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /messages/:id/read error:', err);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

module.exports = router;