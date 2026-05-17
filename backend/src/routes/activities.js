const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/activities — returns all activities from DB
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, description, difficulty_level, type, created_at
             FROM activity
             ORDER BY difficulty_level ASC, name ASC`
        );
        res.json({ activities: rows });
    } catch (err) {
        console.error('GET /activities error:', err);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// PUT /api/activities/complete — marks an assigned activity as completed
router.put('/complete', verifyToken, async (req, res) => {
    const { child_id, activity_id, score } = req.body;

    // Validate required fields
    if (!child_id || !activity_id) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: child_id and activity_id' 
        });
    }

    // Score is optional; if not provided, keep NULL
    const scoreValue = (typeof score === 'number' && !isNaN(score)) ? score : null;

    try {
        // ✅ FIX: Use INSERT ... ON DUPLICATE KEY UPDATE so the row is created
        // if it was never explicitly assigned (race condition or manual DB insert).
        // If the row already exists it is updated; if not, it is inserted as completed.
        const [result] = await pool.query(
            `INSERT INTO child_activity_progress
                (child_id, activity_id, completed, score, completed_at)
             VALUES (?, ?, 1, ?, NOW())
             ON DUPLICATE KEY UPDATE
                completed    = 1,
                score        = VALUES(score),
                completed_at = NOW()`,
            [child_id, activity_id, scoreValue]
        );

        // affectedRows is 1 on INSERT, 2 on UPDATE — both are success
        res.json({ success: true, message: 'Activity marked as completed' });
    } catch (err) {
        console.error('PUT /activities/complete error:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

module.exports = router;