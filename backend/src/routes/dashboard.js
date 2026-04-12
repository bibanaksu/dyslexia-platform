const express = require('express');
const pool = require('../db');
const { requireTherapist } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require a valid therapist JWT
router.use(requireTherapist);

// ──────────────────────────────────────────────────────────────
// GET /api/dashboard/students
// 
// Child table has: id, full_name, grade, parent_id, dob, created_at
// No therapist_id, no age column — we calculate age from dob
// No status/score columns — we return neutral defaults so the
// frontend renders real children with mock score data
// ──────────────────────────────────────────────────────────────
router.get('/students', async (req, res) => {
    try {
        const therapistId = req.user.id;
        console.log(`Dashboard /students requested by therapist #${therapistId}`);

        const [rows] = await pool.query(
            `SELECT
                c.id,
                c.full_name                                         AS name,
                CONCAT('Grade ', c.grade)                          AS grade,
                COALESCE(
                    TIMESTAMPDIFF(YEAR, c.dob, CURDATE()),
                    0
                )                                                   AS age,
                'ON TRACK'                                          AS status,
                75                                                  AS phonologicalScore,
                0                                                   AS scoreDelta,
                50                                                  AS fluency,
                100                                                 AS fluencyMax
             FROM Child c
             ORDER BY c.full_name ASC`
        );

        // Attach a placeholder trend array per student
        const students = rows.map((r, i) => ({
            ...r,
            trend: [40, 45, 50, 55, 58, 62, 65].map(v => v + i * 2),
        }));

        res.json({ students });
    } catch (err) {
        console.error('Dashboard /students error:', err.message);
        res.json({ students: [] });   // frontend falls back to mock data
    }
});

// ──────────────────────────────────────────────────────────────
// POST /api/dashboard/students
//
// We can only insert what the schema allows:
// full_name, grade (int), parent_id (required FK — use 0 or
// a placeholder until proper parent linking is built)
// ──────────────────────────────────────────────────────────────
router.post('/students', async (req, res) => {
    try {
        const { name, grade, age } = req.body;

        if (!name || !grade) {
            return res.status(400).json({ error: 'name and grade are required' });
        }

        // Extract numeric grade from strings like "Grade 3" or plain "3"
        const gradeNum = parseInt(String(grade).replace(/\D/g, '')) || 1;

        // Calculate a dob from age if provided, else leave null
        let dob = null;
        if (age) {
            const year = new Date().getFullYear() - parseInt(age);
            dob = `${year}-01-01`;
        }

        // parent_id is NOT NULL in schema — use 0 as a placeholder
        // (replace with real parent selection when you build that flow)
        const [result] = await pool.query(
            `INSERT INTO Child (full_name, grade, parent_id, dob)
             VALUES (?, ?, 0, ?)`,
            [name.trim(), gradeNum, dob]
        );

        res.status(201).json({
            student: {
                id: result.insertId,
                name: name.trim(),
                grade: `Grade ${gradeNum}`,
                age: parseInt(age) || 0,
                status: 'ON TRACK',
                phonologicalScore: 75,
                scoreDelta: 0,
                fluency: 50,
                fluencyMax: 100,
                trend: [40, 45, 50, 55, 58, 62, 65],
            },
        });
    } catch (err) {
        console.error('Dashboard POST /students error:', err.message);
        res.status(500).json({ error: 'Failed to add student', details: err.message });
    }
});

// ──────────────────────────────────────────────────────────────
// GET /api/dashboard/activity
//
// Activity table is an exercise LIBRARY (name, description,
// difficulty_level) — not an event log. We surface it as
// "available activities" so the therapist can see what exists.
// ──────────────────────────────────────────────────────────────
router.get('/activity', async (req, res) => {
    try {
        console.log(`Dashboard /activity requested by therapist #${req.user.id}`);

        const [rows] = await pool.query(
            `SELECT
                id,
                name        AS title,
                CONCAT(
                    description,
                    ' • Difficulty: ', difficulty_level,
                    ' • Added: ', DATE_FORMAT(created_at, '%b %d, %Y')
                )           AS sub,
                CASE difficulty_level
                    WHEN 1 THEN '#10b981'
                    WHEN 2 THEN '#4a7cf6'
                    WHEN 3 THEN '#f59e0b'
                    ELSE        '#e84848'
                END         AS dot
             FROM Activity
             ORDER BY created_at DESC
             LIMIT 20`
        );

        res.json({ activity: rows });
    } catch (err) {
        console.error('Dashboard /activity error:', err.message);
        res.json({ activity: [] });
    }
});

// ──────────────────────────────────────────────────────────────
// GET /api/dashboard/notes
// POST /api/dashboard/notes
//
// TherapistNote table may not exist yet — both endpoints
// handle that gracefully and return empty / a clear error msg
// ──────────────────────────────────────────────────────────────
router.get('/notes', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                note_text                               AS text,
                DATE_FORMAT(created_at, '%b %d, %Y')   AS date
             FROM TherapistNote
             WHERE therapist_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.json({ notes: rows });
    } catch (err) {
        // Table probably doesn't exist yet — return empty silently
        console.warn('Dashboard /notes (GET) — table may not exist:', err.message);
        res.json({ notes: [] });
    }
});

router.post('/notes', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) {
            return res.status(400).json({ error: 'Note text is required' });
        }

        const [result] = await pool.query(
            `INSERT INTO TherapistNote (therapist_id, note_text) VALUES (?, ?)`,
            [req.user.id, text.trim()]
        );

        res.status(201).json({
            note: {
                id: result.insertId,
                text: text.trim(),
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                }),
            },
        });
    } catch (err) {
        console.error('Dashboard POST /notes error:', err.message);
        // If the table doesn't exist, tell the dev clearly
        if (err.message.includes("doesn't exist")) {
            return res.status(500).json({
                error: 'TherapistNote table not found. Run the migration below:',
                migration: `
CREATE TABLE TherapistNote (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    therapist_id  INT NOT NULL,
    note_text     TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (therapist_id) REFERENCES Therapist(id) ON DELETE CASCADE
);`,
            });
        }
        res.status(500).json({ error: 'Failed to save note', details: err.message });
    }
});

module.exports = router;