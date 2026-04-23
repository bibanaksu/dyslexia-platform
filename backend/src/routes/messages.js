// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// ── GET /api/messages ─────────────────────────────────────────
// Returns all messages for the logged-in user (parent or therapist)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params;
        
        if (req.user.role === 'parent') {
            // Parent sees messages with their assigned therapist
            query = `
                SELECT m.*, 
                       p.full_name as parent_name,
                       t.username as therapist_name
                FROM Message m
                LEFT JOIN Parent p ON m.parent_id = p.id
                LEFT JOIN Therapist t ON m.therapist_id = t.id
                WHERE m.parent_id = ?
                ORDER BY m.created_at ASC
            `;
            params = [req.user.id];
        } else if (req.user.role === 'therapist') {
            // Therapist sees messages from all their assigned parents
            query = `
                SELECT m.*, 
                       p.full_name as parent_name,
                       t.username as therapist_name
                FROM Message m
                LEFT JOIN Parent p ON m.parent_id = p.id
                LEFT JOIN Therapist t ON m.therapist_id = t.id
                WHERE m.therapist_id = ?
                ORDER BY m.created_at ASC
            `;
            params = [req.user.id];
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

// ── POST /api/messages ────────────────────────────────────────
// Send a new message
router.post('/', verifyToken, async (req, res) => {
    try {
        const { content, therapistId } = req.body;
        
        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        let parentId = null;
        let therapistIdValue = null;
        
        if (req.user.role === 'parent') {
            parentId = req.user.id;
            // Get the assigned therapist for this parent (if not provided)
            if (therapistId) {
                therapistIdValue = therapistId;
            } else {
                const [[parent]] = await pool.query(
                    'SELECT assigned_therapist_id FROM Parent WHERE id = ?',
                    [parentId]
                );
                therapistIdValue = parent?.assigned_therapist_id || null;
            }
        } else if (req.user.role === 'therapist') {
            therapistIdValue = req.user.id;
            // therapistId would contain the parent_id in this case
            parentId = therapistId || null;
        }
        
        if (!parentId && !therapistIdValue) {
            return res.status(400).json({ error: 'Cannot determine conversation participants' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO Message (parent_id, therapist_id, sender_role, content)
             VALUES (?, ?, ?, ?)`,
            [parentId, therapistIdValue, req.user.role, content.trim()]
        );
        
        const [[message]] = await pool.query(
            `SELECT m.*, 
                    p.full_name as parent_name,
                    t.username as therapist_name
             FROM Message m
             LEFT JOIN Parent p ON m.parent_id = p.id
             LEFT JOIN Therapist t ON m.therapist_id = t.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        
        res.json({ message });
    } catch (err) {
        console.error('POST /messages error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// ── GET /api/messages/unread-count ────────────────────────────
// Get count of unread messages for the logged-in user
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        let query, params;
        
        if (req.user.role === 'parent') {
            query = `
                SELECT COUNT(*) as count
                FROM Message
                WHERE parent_id = ? AND is_read = FALSE AND sender_role = 'therapist'
            `;
            params = [req.user.id];
        } else if (req.user.role === 'therapist') {
            query = `
                SELECT COUNT(*) as count
                FROM Message
                WHERE therapist_id = ? AND is_read = FALSE AND sender_role = 'parent'
            `;
            params = [req.user.id];
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        
        const [[result]] = await pool.query(query, params);
        res.json({ count: result.count });
    } catch (err) {
        console.error('GET /messages/unread-count error:', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// ── PUT /api/messages/:id/read ─────────────────────────────────
// Mark a message as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE Message SET is_read = TRUE WHERE id = ?',
            [req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /messages/:id/read error:', err);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

module.exports = router;