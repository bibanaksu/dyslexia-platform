// backend/routes/assessmentSummaryRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — Must match frontend!
// ─────────────────────────────────────────────────────────────
const USE_WEIGHTED_SCORE = true;  // Set to false for simple average

// Task weights — must match frontend TASK_WEIGHTS
const TASK_WEIGHTS = {
  task1: 2,  // Word Explorer
  task2: 2,  // Story Reader  
  task3: 3,  // Letter Detective (higher weight)
  task4: 1,  // Number Memory
};

// NEW risk thresholds (85/70/50)
const getRiskLevel = (score) => {
  if (score == null) return null;
  if (score >= 85) return 'Normal';
  if (score >= 70) return 'Mild';
  if (score >= 50) return 'Moderate';
  return 'Severe';
};

// NEW scoring calculation
const calculateOverallScore = (scores) => {
  const tasksCompleted = Object.values(scores).filter(s => s != null);
  if (tasksCompleted.length === 0) return null;

  if (!USE_WEIGHTED_SCORE) {
    // Case 1 — Simple average
    const sum = tasksCompleted.reduce((a, b) => a + b, 0);
    return Math.round(sum / tasksCompleted.length);
  } else {
    // Case 2 — Weighted average
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
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

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/summary/:sessionUUID
// ─────────────────────────────────────────────────────────────
router.get('/summary/:sessionUUID', async (req, res) => {
  const { sessionUUID } = req.params;
  if (!sessionUUID) return res.status(400).json({ success:false, error:'sessionUUID required.' });
  
  try {
    const [sessions] = await db.execute('SELECT * FROM child_info_sessions WHERE session_uuid=? LIMIT 1',[sessionUUID]);
    if (!sessions.length) return res.status(404).json({ success:false, error:'Session not found.' });
    const session = sessions[0];

    const get = async (table) => {
      const [rows] = await db.execute(`SELECT * FROM ${table} WHERE session_uuid=? AND is_partial=0 ORDER BY completed_at DESC LIMIT 1`,[sessionUUID]);
      return rows[0]||null;
    };
    const [t1,t2,t3,t4] = await Promise.all([
      get('task1_word_results'),
      get('task2_results'),
      get('task3_letter_similarity_results'),
      get('task4_number_sequence_results')
    ]);

    // Build scores object
    const scores = {
      task1: t1?.percentage ?? null,
      task2: t2?.percentage ?? null,
      task3: t3?.percentage ?? null,
      task4: t4?.percentage ?? null
    };
    
    const overall = calculateOverallScore(scores);
    const risk = getRiskLevel(overall);
    const tasksCompleted = Object.values(scores).filter(s => s != null).length;

    // Store in DB (optional — if you want to save calculated results)
    if (tasksCompleted > 0) {
      await db.execute(
        `INSERT INTO full_assessment_summary 
         (session_uuid, child_name, child_grade, parent_id, child_id, 
          task1_score, task2_score, task3_score, task4_score, 
          overall_score, risk_level, scoring_method)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE 
          task1_score=VALUES(task1_score), task2_score=VALUES(task2_score),
          task3_score=VALUES(task3_score), task4_score=VALUES(task4_score),
          overall_score=VALUES(overall_score), risk_level=VALUES(risk_level),
          scoring_method=VALUES(scoring_method), updated_at=NOW()`,
        [
          sessionUUID, session.child_name, session.child_grade, 
          session.parent_id || null, session.child_id || null,
          t1?.percentage ?? null, t2?.percentage ?? null,
          t3?.percentage ?? null, t4?.percentage ?? null,
          overall, risk,
          USE_WEIGHTED_SCORE ? 'weighted' : 'simple_average'
        ]
      );
    }

    return res.json({
      success: true,
      session: { 
        sessionUUID, 
        childName: session.child_name, 
        childGrade: session.child_grade, 
        createdAt: session.created_at 
      },
      tasks: {
        task1: t1 ? { score: t1.percentage, performanceLevel: t1.performance_level } : null,
        task2: t2 ? { score: t2.percentage, fluencyLevel: t2.fluency_level } : null,
        task3: t3 ? { score: t3.percentage, performanceLevel: t3.performance_level } : null,
        task4: t4 ? { score: t4.percentage, performanceLevel: t4.performance_level } : null,
      },
      summary: { 
        overallScore: overall, 
        riskLevel: risk, 
        tasksCompleted: tasksCompleted,
        scoringMethod: USE_WEIGHTED_SCORE ? 'weighted' : 'simple_average'
      }
    });
  } catch(err) { 
    console.error('summary error:', err); 
    return res.status(500).json({ success: false, error: 'Database error.' }); 
  }
});

// GET /api/assessment/summaries (unchanged, but consider adding scoring_method)
router.get('/summaries', async (req, res) => {
  const { parentId } = req.query;
  if(!parentId) return res.status(400).json({ success: false, error: 'parentId required.' });
  try {
    const [rows] = await db.execute(
      `SELECT f.*, s.created_at AS session_started_at 
       FROM full_assessment_summary f 
       JOIN child_info_sessions s ON s.session_uuid = f.session_uuid 
       WHERE f.parent_id = ? 
       ORDER BY f.completed_at DESC`,
      [parentId]
    );
    return res.json({ success: true, summaries: rows });
  } catch(err) {
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

module.exports = router;