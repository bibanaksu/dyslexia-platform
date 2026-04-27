// backend/routes/spellingActivityRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireParent } = require('../middleware/auth');

router.get('/words', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, word, image_path, letters FROM spelling_words ORDER BY display_order ASC`
        );
        const words = rows.map(row => ({
            id: row.id,
            name: row.word,
            image: row.image_path,
            letters: typeof row.letters === 'string' ? JSON.parse(row.letters) : row.letters
        }));
        res.json({ success: true, words });
    } catch (err) {
        console.error('GET /spelling/words error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/save', verifyToken, requireParent, async (req, res) => {
    try {
        let { childId, score, totalWords, wrongWords, childSessionId } = req.body;
        if (!childId || score === undefined) {
            return res.status(400).json({ error: 'childId and score are required' });
        }
        const total = totalWords || 10;
        const wrong = wrongWords || [];

        // Verify child belongs to parent
        const [[child]] = await db.execute(
            'SELECT id FROM child WHERE id = ? AND parent_id = ?',
            [childId, req.user.id]
        );
        if (!child) {
            return res.status(403).json({ error: 'Child not found or not associated with this parent' });
        }

        // If childSessionId not provided, fetch the latest session for this child
        if (!childSessionId) {
            const [[latestSession]] = await db.execute(
                `SELECT id FROM child_session WHERE child_id = ? ORDER BY created_at DESC LIMIT 1`,
                [childId]
            );
            if (latestSession) {
                childSessionId = latestSession.id;
            }
        }

        const details = JSON.stringify({ wrong_words: wrong, max_score: total * 10, completed_at: new Date().toISOString() });

        await db.execute(
            `INSERT INTO spelling_results (child_id, child_session_id, score, total_words, completed, details, played_at)
             VALUES (?, ?, ?, ?, 1, ?, NOW())`,
            [childId, childSessionId || null, score, total, details]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('POST /spelling/save error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;