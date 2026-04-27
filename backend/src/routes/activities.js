const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/messages
router.get('/', verifyToken, async (req, res) => {
    try {
        let sql;
        let params;
        
        if (req.user.role === 'parent') {
            sql = `
                SELECT m.*, p.full_name as parent_name, t.username as therapist_name, c.full_name as child_name
                FROM message m
                JOIN parent p ON m.parent_id = p.id
                JOIN therapist t ON m.therapist_id = t.id
                LEFT JOIN child c ON m.child_id = c.id
                WHERE m.parent_id = ?
                ORDER BY m.created_at ASC
            `;
            params = [req.user.id];
        } else {
            sql = `
                SELECT m.*, p.full_name as parent_name, t.username as therapist_name, c.full_name as child_name
                FROM message m
                JOIN parent p ON m.parent_id = p.id
                JOIN therapist t ON m.therapist_id = t.id
                LEFT JOIN child c ON m.child_id = c.id
                WHERE m.therapist_id = ?
                ORDER BY m.created_at ASC
            `;
            params = [req.user.id];
        }
        
        const [messages] = await pool.query(sql, params);
        res.json({ messages });
    } catch (err) {
        console.error('GET /messages error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /api/messages
router.post('/', verifyToken, async (req, res) => {
    try {
        const { content, parent_id, child_id } = req.body;
        
        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        let parentId, therapistId;
        
        if (req.user.role === 'parent') {
            parentId = req.user.id;
            const [[parent]] = await pool.query(
                'SELECT assigned_therapist_id FROM parent WHERE id = ?',
                [parentId]
            );
            therapistId = parent?.assigned_therapist_id;
        } else {
            therapistId = req.user.id;
            parentId = parent_id;
        }
        
        if (!parentId || !therapistId) {
            return res.status(400).json({ error: 'Cannot determine conversation participants' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO message (parent_id, therapist_id, child_id, sender_role, content)
             VALUES (?, ?, ?, ?, ?)`,
            [parentId, therapistId, child_id || null, req.user.role, content.trim()]
        );
        
        const [[message]] = await pool.query(
            `SELECT m.*, p.full_name as parent_name, t.username as therapist_name
             FROM message m
             JOIN parent p ON m.parent_id = p.id
             JOIN therapist t ON m.therapist_id = t.id
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
        } else {
            query = `SELECT COUNT(*) as count FROM message WHERE therapist_id = ? AND is_read = FALSE AND sender_role = 'parent'`;
            params = [req.user.id];
        }
        
        const [[result]] = await pool.query(query, params);
        res.json({ count: result.count });
    } catch (err) {
        console.error('GET /messages/unread-count error:', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// PUT /api/messages/:id/read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await pool.query('UPDATE message SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /messages/:id/read error:', err);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

module.exports = router;