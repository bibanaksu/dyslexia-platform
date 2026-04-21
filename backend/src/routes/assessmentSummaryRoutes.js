// backend/routes/assessmentSummaryRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

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
    const [t1,t2,t3,t4] = await Promise.all([get('task1_word_results'),get('task2_results'),get('task3_letter_similarity_results'),get('task4_number_sequence_results')]);

    const scores = [t1?.percentage,t2?.percentage,t3?.percentage,t4?.percentage].filter(s=>s!=null);
    const overall = scores.length>0 ? Math.round(scores.reduce((a,b)=>a+Number(b),0)/scores.length) : null;
    let risk = null;
    if(overall!==null){ if(overall>=80)risk='Low Risk'; else if(overall>=60)risk='Moderate Risk'; else risk='High Risk'; }

    if(scores.length>0){
      await db.execute(
        `INSERT INTO full_assessment_summary (session_uuid,child_name,child_grade,parent_id,child_id,task1_score,task2_score,task3_score,task4_score,overall_score,risk_level)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE task1_score=VALUES(task1_score),task2_score=VALUES(task2_score),task3_score=VALUES(task3_score),task4_score=VALUES(task4_score),overall_score=VALUES(overall_score),risk_level=VALUES(risk_level),updated_at=NOW()`,
        [sessionUUID,session.child_name,session.child_grade,session.parent_id||null,session.child_id||null,t1?.percentage??null,t2?.percentage??null,t3?.percentage??null,t4?.percentage??null,overall,risk]
      );
    }

    return res.json({
      success:true,
      session:{ sessionUUID, childName:session.child_name, childGrade:session.child_grade, createdAt:session.created_at },
      tasks:{
        task1:t1?{score:t1.percentage,performanceLevel:t1.performance_level,totalScore:t1.total_score,totalWords:t1.total_words,totalTimeSecs:t1.total_time_seconds}:null,
        task2:t2?{score:t2.percentage,fluencyLevel:t2.fluency_level,correctWords:t2.correct_words,totalWords:t2.total_words,wpm:t2.reading_speed_wpm,totalTimeSecs:t2.time_used_seconds}:null,
        task3:t3?{score:t3.percentage,performanceLevel:t3.performance_level,correctCount:t3.correct_count,totalExercises:t3.total_exercises,totalTimeSecs:t3.total_time_seconds}:null,
        task4:t4?{score:t4.percentage,performanceLevel:t4.performance_level,correctCount:t4.correct_count,totalPossible:t4.total_possible,totalTimeSecs:t4.total_time_seconds}:null,
      },
      summary:{ overallScore:overall, riskLevel:risk, tasksCompleted:scores.length }
    });
  } catch(err){ console.error('summary error:',err); return res.status(500).json({success:false,error:'Database error.'}); }
});

router.get('/summaries', async (req, res) => {
  const { parentId } = req.query;
  if(!parentId) return res.status(400).json({success:false,error:'parentId required.'});
  try {
    const[rows]=await db.execute(`SELECT f.*,s.created_at AS session_started_at FROM full_assessment_summary f JOIN child_info_sessions s ON s.session_uuid=f.session_uuid WHERE f.parent_id=? ORDER BY f.completed_at DESC`,[parentId]);
    return res.json({success:true,summaries:rows});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

module.exports = router;