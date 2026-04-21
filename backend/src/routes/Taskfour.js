// backend/routes/Taskfour.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/submit', async (req, res) => {
  const b = req.body;
  const uuid  = b.sessionUUID    || null;
  const cid   = b.childId        || null;
  const pid   = b.parentId       || null;
  const gid   = b.guestId        || null;
  const name  = b.childName      || 'Guest User';
  const grade = b.childGrade     || 'Not Specified';
  const tp    = b.totalPossible  || 20;
  const ci    = b.completedItems || 0;
  const cc    = b.correctCount   || 0;
  const ic    = b.incorrectCount || 0;
  const tc    = b.timeoutCount   || 0;
  const pct   = b.percentage     || 0;
  const perf  = b.performanceLevel || null;
  const time  = b.totalTimeSeconds || 0;
  const avg   = b.avgTimePerItem   || 0;
  const part  = b.isPartial ? 1 : 0;
  const det   = b.sequenceDetails?(typeof b.sequenceDetails==='string'?b.sequenceDetails:JSON.stringify(b.sequenceDetails)):null;

  try {
    const [result] = await db.execute(
      `INSERT INTO task4_number_sequence_results
         (session_uuid,child_id,parent_id,guest_id,child_name,child_grade,
          total_possible,completed_items,correct_count,incorrect_count,timeout_count,
          percentage,performance_level,total_time_seconds,avg_time_per_item,sequence_details,is_partial)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         child_name=VALUES(child_name),child_grade=VALUES(child_grade),
         total_possible=VALUES(total_possible),completed_items=VALUES(completed_items),
         correct_count=VALUES(correct_count),incorrect_count=VALUES(incorrect_count),
         timeout_count=VALUES(timeout_count),percentage=VALUES(percentage),
         performance_level=VALUES(performance_level),total_time_seconds=VALUES(total_time_seconds),
         avg_time_per_item=VALUES(avg_time_per_item),sequence_details=VALUES(sequence_details),
         is_partial=VALUES(is_partial),updated_at=NOW()`,
      [uuid,cid,pid,gid,name,grade,tp,ci,cc,ic,tc,pct,perf,time,avg,det,part]
    );
    let resultId = result.insertId;
    if(!resultId&&uuid){const[rows]=await db.execute('SELECT id FROM task4_number_sequence_results WHERE session_uuid=? LIMIT 1',[uuid]);if(rows.length)resultId=rows[0].id;}
    return res.json({success:true,resultId});
  } catch(err){console.error('task4/submit error:',err);return res.status(500).json({success:false,error:'Database error.'});}
});

router.patch('/submit/:id', async (req, res) => {
  const { id } = req.params; const b = req.body;
  const det=b.sequenceDetails?(typeof b.sequenceDetails==='string'?b.sequenceDetails:JSON.stringify(b.sequenceDetails)):null;
  try {
    await db.execute(
      `UPDATE task4_number_sequence_results SET
         session_uuid=COALESCE(?,session_uuid),child_name=COALESCE(?,child_name),child_grade=COALESCE(?,child_grade),
         total_possible=?,completed_items=?,correct_count=?,incorrect_count=?,percentage=?,
         performance_level=?,total_time_seconds=?,avg_time_per_item=?,sequence_details=?,is_partial=?,updated_at=NOW()
       WHERE id=?`,
      [b.sessionUUID||null,b.childName||null,b.childGrade||null,
       b.totalPossible||20,b.completedItems||0,b.correctCount||0,b.incorrectCount||0,b.percentage||0,
       b.performanceLevel||null,b.totalTimeSeconds||0,b.avgTimePerItem||0,det,b.isPartial?1:0,id]
    );
    return res.json({success:true});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

router.get('/results', async (req, res) => {
  const { sessionUUID, childName, parentId } = req.query;
  try {
    let sql,params;
    if(sessionUUID){sql='SELECT * FROM task4_number_sequence_results WHERE session_uuid=? ORDER BY completed_at DESC';params=[sessionUUID];}
    else if(childName&&parentId){sql=`SELECT t.* FROM task4_number_sequence_results t JOIN child_info_sessions s ON s.session_uuid=t.session_uuid WHERE s.child_name=? AND s.parent_id=? ORDER BY t.completed_at DESC`;params=[childName,parentId];}
    else return res.status(400).json({success:false,error:'Provide sessionUUID or childName+parentId.'});
    const[rows]=await db.execute(sql,params);
    return res.json({success:true,results:rows});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

router.get('/stats/:childId', async (req, res) => {
  try {
    const[rows]=await db.execute(`SELECT COUNT(*) AS attempts,AVG(percentage) AS avg_pct,MAX(percentage) AS best_pct FROM task4_number_sequence_results WHERE child_id=? AND is_partial=0`,[req.params.childId]);
    return res.json({success:true,stats:rows[0]});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

module.exports = router;