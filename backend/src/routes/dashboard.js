// routes/dashboard.js
// All routes are therapist-protected (requireTherapist applied via router.use below)
const express = require('express');
const pool    = require('../db');
const { requireTherapist } = require('../middleware/auth');

const router = express.Router();
router.use(requireTherapist);

// ══════════════════════════════════════════════════════════════
// GET /api/dashboard/students
// Returns all children with their REAL latest assessment scores.
// No mock data — if a child has no assessment yet, scores = null.
// ══════════════════════════════════════════════════════════════
router.get('/students', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                c.id,
                c.full_name                                         AS name,
                CONCAT('Grade ', c.grade)                          AS grade,
                COALESCE(
                    TIMESTAMPDIFF(YEAR, c.dob, CURDATE()),
                    NULL
                )                                                   AS age,
                -- Latest assessment scores via correlated subquery
                (
                    SELECT ar.letter_recognition_score
                    FROM   Assessment a
                    JOIN   AssessmentResults ar ON ar.assessment_id = a.id
                    WHERE  a.child_id = c.id
                    ORDER  BY a.assessment_date DESC
                    LIMIT  1
                )                                                   AS letterScore,
                (
                    SELECT ar.word_reading_score
                    FROM   Assessment a
                    JOIN   AssessmentResults ar ON ar.assessment_id = a.id
                    WHERE  a.child_id = c.id
                    ORDER  BY a.assessment_date DESC
                    LIMIT  1
                )                                                   AS wordScore,
                (
                    SELECT ar.comprehension_score
                    FROM   Assessment a
                    JOIN   AssessmentResults ar ON ar.assessment_id = a.id
                    WHERE  a.child_id = c.id
                    ORDER  BY a.assessment_date DESC
                    LIMIT  1
                )                                                   AS comprehensionScore,
                (
                    SELECT ar.overall_evaluation
                    FROM   Assessment a
                    JOIN   AssessmentResults ar ON ar.assessment_id = a.id
                    WHERE  a.child_id = c.id
                    ORDER  BY a.assessment_date DESC
                    LIMIT  1
                )                                                   AS overallEvaluation,
                -- Count of completed assessments
                (
                    SELECT COUNT(*)
                    FROM   Assessment a2
                    WHERE  a2.child_id = c.id
                )                                                   AS assessmentCount,
                -- Latest assessment date
                (
                    SELECT MAX(a3.assessment_date)
                    FROM   Assessment a3
                    WHERE  a3.child_id = c.id
                )                                                   AS lastAssessmentDate,
                -- Activity progress: % of activities completed
                (
                    SELECT ROUND(
                        100.0 * SUM(cap.completed) / NULLIF(COUNT(*), 0),
                        1
                    )
                    FROM ChildActivityProgress cap
                    WHERE cap.child_id = c.id
                )                                                   AS activityCompletionPct
             FROM Child c
             ORDER BY c.full_name ASC`
        );

        // Compute a derived status based on real data
        const students = rows.map(r => {
            // Average of available scores
            const scores = [r.letterScore, r.wordScore, r.comprehensionScore]
                .filter(s => s !== null && s !== undefined)
                .map(Number);

            const avg = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : null;

            let status = 'NO DATA';
            if (avg !== null) {
                if (avg >= 75)      status = 'ON TRACK';
                else if (avg >= 50) status = 'NEEDS SUPPORT';
                else                status = 'AT RISK';
            }

            return {
                id:                  r.id,
                name:                r.name,
                grade:               r.grade,
                age:                 r.age,
                status,
                // Real scores (null if no assessment yet)
                letterScore:          r.letterScore          !== null ? Number(r.letterScore)          : null,
                wordScore:            r.wordScore            !== null ? Number(r.wordScore)            : null,
                comprehensionScore:   r.comprehensionScore   !== null ? Number(r.comprehensionScore)   : null,
                overallEvaluation:    r.overallEvaluation    || null,
                // Averaged phonological score for the dashboard card
                phonologicalScore:    avg !== null ? Math.round(avg) : null,
                assessmentCount:      Number(r.assessmentCount),
                lastAssessmentDate:   r.lastAssessmentDate   || null,
                activityCompletionPct: r.activityCompletionPct !== null ? Number(r.activityCompletionPct) : null,
            };
        });

        res.json({ students });

    } catch (err) {
        console.error('Dashboard /students error:', err.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/dashboard/students
// Adds a new child. Requires name and grade.
// ══════════════════════════════════════════════════════════════
router.post('/students', async (req, res) => {
    try {
        const { name, grade, age, parentId } = req.body;

        if (!name || !grade) {
            return res.status(400).json({ error: 'name and grade are required' });
        }

        const gradeNum = parseInt(String(grade).replace(/\D/g, '')) || 1;

        let dob = null;
        if (age) {
            const year = new Date().getFullYear() - parseInt(age);
            dob = `${year}-01-01`;
        }

        // parent_id: use provided value or 0 as placeholder
        const pid = parentId ? parseInt(parentId) : 0;

        const [result] = await pool.query(
            'INSERT INTO Child (full_name, grade, parent_id, dob) VALUES (?, ?, ?, ?)',
            [name.trim(), gradeNum, pid, dob]
        );

        res.status(201).json({
            student: {
                id:                  result.insertId,
                name:                name.trim(),
                grade:               `Grade ${gradeNum}`,
                age:                 parseInt(age) || null,
                status:              'NO DATA',
                phonologicalScore:   null,
                assessmentCount:     0,
                lastAssessmentDate:  null,
                activityCompletionPct: null,
            },
        });
    } catch (err) {
        console.error('Dashboard POST /students error:', err.message);
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/dashboard/activity
// Returns the Activity library (what exercises exist).
// ══════════════════════════════════════════════════════════════
router.get('/activity', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                name             AS title,
                description      AS sub,
                difficulty_level AS difficulty,
                CASE difficulty_level
                    WHEN 1 THEN '#10b981'
                    WHEN 2 THEN '#4a7cf6'
                    WHEN 3 THEN '#f59e0b'
                    ELSE        '#e84848'
                END              AS dot,
                created_at
             FROM Activity
             ORDER BY difficulty_level ASC, name ASC`
        );

        res.json({ activity: rows });
    } catch (err) {
        console.error('Dashboard /activity error:', err.message);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/dashboard/notes
// POST /api/dashboard/notes
// ══════════════════════════════════════════════════════════════
router.get('/notes', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id,
                note_text                               AS text,
                DATE_FORMAT(created_at, '%b %d, %Y')   AS date,
                created_at
             FROM TherapistNote
             WHERE therapist_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.json({ notes: rows });
    } catch (err) {
        console.error('Dashboard /notes GET error:', err.message);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

router.post('/notes', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) {
            return res.status(400).json({ error: 'Note text is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO TherapistNote (therapist_id, note_text) VALUES (?, ?)',
            [req.user.id, text.trim()]
        );

        res.status(201).json({
            note: {
                id:   result.insertId,
                text: text.trim(),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            },
        });
    } catch (err) {
        console.error('Dashboard POST /notes error:', err.message);
        res.status(500).json({ error: 'Failed to save note' });
    }
});

// ══════════════════════════════════════════════════════════════
// GET /api/dashboard/audit-log
// Returns login history visible to the therapist in the UI.
// ══════════════════════════════════════════════════════════════
router.get('/audit-log', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                al.id,
                al.user_id,
                al.user_role,
                al.event_type,
                al.ip_address,
                LEFT(al.user_agent, 120)                AS user_agent,
                al.created_at,
                DATE_FORMAT(al.created_at, '%b %d, %Y %H:%i') AS formatted_time,
                -- Attach a display name
                CASE al.user_role
                    WHEN 'therapist' THEN (SELECT username  FROM Therapist WHERE id = al.user_id)
                    WHEN 'parent'    THEN (SELECT full_name FROM Parent     WHERE id = al.user_id)
                END                                     AS user_name
             FROM AuditLog al
             ORDER BY al.created_at DESC
             LIMIT 200`,
            []
        );

        res.json({ auditLog: rows });
    } catch (err) {
        console.error('Dashboard /audit-log error:', err.message);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

module.exports = router;