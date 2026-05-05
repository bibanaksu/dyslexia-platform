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

module.exports = router;