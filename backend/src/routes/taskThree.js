// backend/routes/taskThree.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/exercises', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM letter_similarity_exercises ORDER BY display_order ASC');
    return res.json({ success:true, exercises:rows });
  } catch(err) { return res.status(500).json({ success:false, error:'Database error.' }); }
});

router.post('/submit', async (req, res) => {
  const b = req.body;
  const uuid   = b.sessionUUID      || null;
  const cid    = b.childId          || null;
  const pid    = b.parentId         || null;
  const name   = b.childName        || 'Guest User';
  const grade  = b.childGrade       || 'Not Specified';
  const total  = b.totalExercises   || 20;
  const correct= b.correctCount     || 0;
  const wrong  = b.incorrectCount   || 0;
  const tout   = b.timeoutCount     || 0;
  const pct    = b.percentage       || 0;
  const perf   = b.performanceLevel || null;
  const time   = b.totalTimeSeconds || 0;
  const avg    = b.avgTimePerExercise|| 0;
  const partial= b.isPartial        ? 1 : 0;
  const details= b.exerciseDetails?(typeof b.exerciseDetails==='string'?b.exerciseDetails:JSON.stringify(b.exerciseDetails)):null;

  try {
    const [result] = await db.execute(
      `INSERT INTO task3_letter_similarity_results
         (session_uuid,child_id,parent_id,child_name,child_grade,
          total_exercises,correct_count,incorrect_count,timeout_count,
          percentage,performance_level,total_time_seconds,avg_time_per_exercise,
          exercise_details,is_partial)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         child_name=VALUES(child_name),child_grade=VALUES(child_grade),
         total_exercises=VALUES(total_exercises),correct_count=VALUES(correct_count),
         incorrect_count=VALUES(incorrect_count),timeout_count=VALUES(timeout_count),
         percentage=VALUES(percentage),performance_level=VALUES(performance_level),
         total_time_seconds=VALUES(total_time_seconds),
         avg_time_per_exercise=VALUES(avg_time_per_exercise),
         exercise_details=VALUES(exercise_details),is_partial=VALUES(is_partial),updated_at=NOW()`,
      [uuid,cid,pid,name,grade,total,correct,wrong,tout,pct,perf,time,avg,details,partial]
    );
    let resultId = result.insertId;
    if(!resultId&&uuid){const[rows]=await db.execute('SELECT id FROM task3_letter_similarity_results WHERE session_uuid=? LIMIT 1',[uuid]);if(rows.length)resultId=rows[0].id;}
    return res.json({ success:true, resultId });
  } catch(err) { console.error('task3/submit error:',err); return res.status(500).json({ success:false, error:'Database error.' }); }
});

router.patch('/submit/:id', async (req, res) => {
  const { id } = req.params; const b = req.body;
  const det=b.exerciseDetails?(typeof b.exerciseDetails==='string'?b.exerciseDetails:JSON.stringify(b.exerciseDetails)):null;
  try {
    await db.execute(
      `UPDATE task3_letter_similarity_results SET
         session_uuid=COALESCE(?,session_uuid),child_name=COALESCE(?,child_name),child_grade=COALESCE(?,child_grade),
         total_exercises=?,correct_count=?,incorrect_count=?,timeout_count=?,percentage=?,
         performance_level=?,total_time_seconds=?,avg_time_per_exercise=?,exercise_details=?,is_partial=?,updated_at=NOW()
       WHERE id=?`,
      [b.sessionUUID||null,b.childName||null,b.childGrade||null,
       b.totalExercises||20,b.correctCount||0,b.incorrectCount||0,b.timeoutCount||0,b.percentage||0,
       b.performanceLevel||null,b.totalTimeSeconds||0,b.avgTimePerExercise||0,det,b.isPartial?1:0,id]
    );
    return res.json({ success:true });
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

router.get('/results', async (req, res) => {
  const { sessionUUID, childName, parentId } = req.query;
  try {
    let sql,params;
    if(sessionUUID){sql='SELECT * FROM task3_letter_similarity_results WHERE session_uuid=? ORDER BY completed_at DESC';params=[sessionUUID];}
    else if(childName&&parentId){sql=`SELECT t.* FROM task3_letter_similarity_results t JOIN child_info_sessions s ON s.session_uuid=t.session_uuid WHERE s.child_name=? AND s.parent_id=? ORDER BY t.completed_at DESC`;params=[childName,parentId];}
    else return res.status(400).json({success:false,error:'Provide sessionUUID or childName+parentId.'});
    const[rows]=await db.execute(sql,params);
    return res.json({success:true,results:rows});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

module.exports = router;