const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dyslexia_jwt_secret_change_in_production';

// ── Optional auth (allows both logged-in and guest users) ──
function optionalAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }
    try {
        req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch {
        req.user = null;
    }
    next();
}

function calculateRiskLevel(yesCount, totalQuestions) {
    const pct = (yesCount / totalQuestions) * 100;
    if (pct <= 25) return 'LOW';
    if (pct <= 60) return 'MODERATE';
    return 'HIGH';
}

// =============================================================
// GET /api/quiz/questions
// =============================================================
router.get('/questions', async (req, res) => {
    try {
        console.log('📋 Fetching quiz questions...');

        const [questions] = await pool.query(
            `SELECT id, question_text, display_order
             FROM quiz_questions
             WHERE is_active = TRUE
             ORDER BY display_order ASC`
        );

        console.log(`✅ Found ${questions.length} questions`);
        return res.json({ success: true, questions });

    } catch (err) {
        console.error('❌ Error fetching questions:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch questions: ' + err.message,
        });
    }
});

// =============================================================
// POST /api/quiz/submit  — saves to parent_screening table
// =============================================================
router.post('/submit', optionalAuth, async (req, res) => {
    try {
        console.log('📝 Quiz submission received');

        const { answers, childFullName, childGrade, riskLevel } = req.body;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'answers object is required' });
        }
        if (!childFullName || !childGrade) {
            return res.status(400).json({ error: 'Child full name and grade are required' });
        }

        const totalQuestions   = Object.keys(answers).length;
        const yesCount         = Object.values(answers).filter(Boolean).length;
        const calculatedRisk   = riskLevel || calculateRiskLevel(yesCount, totalQuestions);
        const riskScore        = parseFloat(((yesCount / totalQuestions) * 100).toFixed(2));
        const parent_id        = req.user?.id || null;

        console.log(`Child: ${childFullName} | Grade: ${childGrade}`);
        console.log(`Yes: ${yesCount}/${totalQuestions} | Risk: ${calculatedRisk}`);

        // ── Insert into parent_screening ──────────────────────
        const [insertResult] = await pool.query(
            `INSERT INTO parent_screening
               (parent_id, child_full_name, child_grade, answers,
                total_yes_count, risk_level, risk_score)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                parent_id,
                childFullName.trim(),
                childGrade,
                JSON.stringify(answers),
                yesCount,
                calculatedRisk,
                riskScore,
            ]
        );

        // ── If logged-in parent, update their assessment status ─
        if (parent_id) {
            await pool.query(
                `UPDATE parent
                 SET assessment_completed = TRUE,
                     assessment_date      = NOW(),
                     can_access_activities = TRUE
                 WHERE id = ?`,
                [parent_id]
            );
        }

        console.log(`✅ Quiz saved — ID: ${insertResult.insertId}`);

        return res.status(201).json({
            success:        true,
            screeningId:    insertResult.insertId,
            riskLevel:      calculatedRisk,
            riskScore,
            totalYesCount:  yesCount,
            totalQuestions,
            message: parent_id
                ? 'Quiz results saved to your account'
                : 'Quiz results saved',
        });

    } catch (err) {
        console.error('❌ Quiz submit error:', err.message);
        return res.status(500).json({ error: 'Failed to save quiz results: ' + err.message });
    }
});

// =============================================================
// GET /api/quiz/results  — logged-in parent's own results
// =============================================================
router.get('/results', verifyToken, async (req, res) => {
    try {
        const [screenings] = await pool.query(
            `SELECT id, child_full_name, child_grade, total_yes_count,
                    risk_level, risk_score, answers, completed_at
             FROM parent_screening
             WHERE parent_id = ?
             ORDER BY completed_at DESC`,
            [req.user.id]
        );

        return res.json({ success: true, screenings });

    } catch (err) {
        console.error('Error fetching results:', err.message);
        return res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// =============================================================
// GET /api/quiz/all-submissions  — therapist only
// =============================================================
router.get('/all-submissions', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied. Therapists only.' });
        }

        const [submissions] = await pool.query(
            `SELECT ps.*,
                    p.full_name   AS parent_name,
                    p.email       AS parent_email,
                    p.phone       AS parent_phone
             FROM parent_screening ps
             LEFT JOIN parent p ON ps.parent_id = p.id
             ORDER BY ps.completed_at DESC`
        );

        for (const sub of submissions) {
            if (sub.answers) sub.answers = JSON.parse(sub.answers);
        }

        return res.json({ success: true, submissions });

    } catch (err) {
        console.error('Error fetching submissions:', err.message);
        return res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// =============================================================
// GET /api/quiz/stats  — therapist only
// =============================================================
router.get('/stats', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied. Therapists only.' });
        }

        const [[stats]] = await pool.query(
            `SELECT
                COUNT(*)                                              AS total_submissions,
                SUM(CASE WHEN risk_level = 'LOW'      THEN 1 ELSE 0 END) AS low_risk,
                SUM(CASE WHEN risk_level = 'MODERATE' THEN 1 ELSE 0 END) AS moderate_risk,
                SUM(CASE WHEN risk_level = 'HIGH'     THEN 1 ELSE 0 END) AS high_risk,
                ROUND(AVG(risk_score), 2)                            AS avg_risk_score,
                COUNT(DISTINCT parent_id)                            AS unique_parents,
                COUNT(DISTINCT child_full_name)                      AS unique_children
             FROM parent_screening`
        );

        return res.json({ success: true, stats });

    } catch (err) {
        console.error('Error fetching stats:', err.message);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;