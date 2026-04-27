// backend/routes/assessmentSummaryRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const USE_WEIGHTED_SCORE = true;
const TASK_WEIGHTS = { task1: 2, task2: 2, task3: 3, task4: 1 };

const getRiskLevel = (score) => {
  if (score == null) return null;
  if (score >= 85) return 'Low Risk';
  if (score >= 70) return 'Moderate Risk';
  return 'High Risk';
};

const calculateOverallScore = (scores) => {
  const tasksCompleted = Object.values(scores).filter(s => s != null);
  if (tasksCompleted.length === 0) return null;
  if (!USE_WEIGHTED_SCORE) {
    const sum = tasksCompleted.reduce((a, b) => a + b, 0);
    return Math.round(sum / tasksCompleted.length);
  } else {
    let totalWeightedScore = 0, totalWeight = 0;
    for (const [taskKey, weight] of Object.entries(TASK_WEIGHTS)) {
      const score = scores[taskKey];
      if (score != null) {
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight === 0) return null;
    return Math.round(totalWeightedScore / totalWeight);
  }
};

// Helper to compute and save summary
async function computeAndSaveSummary(childSessionId) {
  const [sessions] = await db.execute('SELECT * FROM child_session WHERE id = ?', [childSessionId]);
  if (sessions.length === 0) throw new Error('Session not found');
  const session = sessions[0];

  const getTask = async (table) => {
    const [rows] = await db.execute(`SELECT * FROM ${table} WHERE child_session_id = ? ORDER BY completed_at DESC LIMIT 1`, [childSessionId]);
    return rows[0] || null;
  };
  const [t1, t2, t3, t4] = await Promise.all([
    getTask('task1_word_results'),
    getTask('task2_results'),
    getTask('task3_letter_similarity_results'),
    getTask('task4_number_memory_results')
  ]);

  const scores = {
    task1: t1?.percentage ?? null,
    task2: t2?.percentage ?? null,
    task3: t3?.percentage ?? null,
    task4: t4?.overall_percentage ?? null
  };
  const overall = calculateOverallScore(scores);
  const risk = getRiskLevel(overall);
  const tasksCompleted = Object.values(scores).filter(s => s != null).length;

  if (tasksCompleted > 0) {
    await db.execute(
      `INSERT INTO full_assessment_summary 
       (child_session_id, child_id, parent_id, task1_score, task2_score, task3_score, task4_score, overall_score, risk_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       child_id = VALUES(child_id),
       parent_id = VALUES(parent_id),
       task1_score = VALUES(task1_score),
       task2_score = VALUES(task2_score),
       task3_score = VALUES(task3_score),
       task4_score = VALUES(task4_score),
       overall_score = VALUES(overall_score),
       risk_level = VALUES(risk_level),
       updated_at = NOW()`,
      [
        childSessionId,
        session.child_id || null,
        session.parent_id || null,
        t1?.percentage ?? null,
        t2?.percentage ?? null,
        t3?.percentage ?? null,
        t4?.overall_percentage ?? null,
        overall,
        risk
      ]
    );
  }
  return { scores, overall, risk, tasksCompleted, session };
}

// GET summary (and also save)
router.get('/summary/:childSessionId', async (req, res) => {
  const childSessionId = parseInt(req.params.childSessionId);
  if (isNaN(childSessionId)) {
    return res.status(400).json({ success: false, error: 'Invalid childSessionId (must be integer).' });
  }
  try {
    const result = await computeAndSaveSummary(childSessionId);
    res.json({
      success: true,
      session: {
        childSessionId,
        childName: result.session.child_name,
        childGrade: result.session.child_grade,
        createdAt: result.session.created_at
      },
      tasks: {
        task1: result.scores.task1 !== null ? { score: result.scores.task1, performanceLevel: null } : null,
        task2: result.scores.task2 !== null ? { score: result.scores.task2, fluencyLevel: null } : null,
        task3: result.scores.task3 !== null ? { score: result.scores.task3, performanceLevel: null } : null,
        task4: result.scores.task4 !== null ? { score: result.scores.task4, performanceLevel: null } : null
      },
      summary: {
        overallScore: result.overall,
        riskLevel: result.risk,
        tasksCompleted: result.tasksCompleted,
        scoringMethod: USE_WEIGHTED_SCORE ? 'weighted' : 'simple_average'
      }
    });
  } catch (err) {
    console.error('summary error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST finalize – explicitly save summary
router.post('/finalize/:childSessionId', async (req, res) => {
  const childSessionId = parseInt(req.params.childSessionId);
  if (isNaN(childSessionId)) {
    return res.status(400).json({ success: false, error: 'Invalid childSessionId (must be integer).' });
  }
  try {
    await computeAndSaveSummary(childSessionId);
    res.json({ success: true, message: 'Assessment finalized and summary saved.' });
  } catch (err) {
    console.error('finalize error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/parent-summaries', async (req, res) => {
  const { parentId } = req.query;
  if (!parentId) return res.status(400).json({ success: false, error: 'parentId required.' });
  try {
    const [rows] = await db.execute(
      `SELECT fas.*, cs.child_name, cs.child_grade, cs.created_at AS session_started_at
       FROM full_assessment_summary fas
       JOIN child_session cs ON cs.id = fas.child_session_id
       WHERE fas.parent_id = ?
       ORDER BY fas.completed_at DESC`,
      [parentId]
    );
    res.json({ success: true, summaries: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;