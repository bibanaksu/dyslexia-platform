// backend/routes/Task2routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/submit', async (req, res) => {
  const b = req.body;
  const uuid   = b.sessionUUID || null;
  const cid    = b.childId     || null;
  const pid    = b.parentId    || null;
  const name   = b.childName   || 'Guest User';
  const grade  = b.childGrade  || 'Not Specified';
  const title  = b.passageTitle|| 'The Teacher';
  const tw     = b.totalWords  || 0;
  const cw     = b.correctWords|| 0;
  const err    = b.errorCount  || 0;
  const tused  = b.timeUsedSeconds || 0;
  const tmax   = b.maxTimeSeconds  || 180;
  const fearly = b.finishedEarly ? 1 : 0;
  const partial= b.is_partial  ? 1 : 0;
  const pct    = tw>0?Math.round((cw/tw)*100):0;
  const wpm    = tused>0?Math.round((cw/tused)*60):0;
  let fluency  = 'Below Basic';
  if(pct>=95)fluency='Advanced';else if(pct>=85)fluency='Proficient';else if(pct>=70)fluency='Basic';
  const errDet = b.errorDetails?(typeof b.errorDetails==='string'?b.errorDetails:JSON.stringify(b.errorDetails)):null;

  try {
    const [result] = await db.execute(
      `INSERT INTO task2_results
         (session_uuid,child_id,parent_id,child_name,child_grade,passage_title,
          total_words,correct_words,error_count,percentage,fluency_level,
          reading_speed_wpm,time_used_seconds,max_time_seconds,finished_early,error_details,is_partial)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         child_name=VALUES(child_name),child_grade=VALUES(child_grade),
         total_words=VALUES(total_words),correct_words=VALUES(correct_words),
         error_count=VALUES(error_count),percentage=VALUES(percentage),
         fluency_level=VALUES(fluency_level),reading_speed_wpm=VALUES(reading_speed_wpm),
         time_used_seconds=VALUES(time_used_seconds),finished_early=VALUES(finished_early),
         error_details=VALUES(error_details),is_partial=VALUES(is_partial),updated_at=NOW()`,
      [uuid,cid,pid,name,grade,title,tw,cw,err,pct,fluency,wpm,tused,tmax,fearly,errDet,partial]
    );
    let resultId = result.insertId;
    if (!resultId && uuid) { const [rows]=await db.execute('SELECT id FROM task2_results WHERE session_uuid=? LIMIT 1',[uuid]); if(rows.length) resultId=rows[0].id; }
    return res.json({ success:true, resultId });
  } catch(err2) { console.error('task2/submit error:',err2); return res.status(500).json({ success:false, error:'Database error.' }); }
});

router.patch('/submit/:id', async (req, res) => {
  const { id } = req.params; const b = req.body;
  const tw=b.totalWords||0; const cw=b.correctWords||0; const tu=b.timeUsedSeconds||0;
  const pct=tw>0?Math.round((cw/tw)*100):0; const wpm=tu>0?Math.round((cw/tu)*60):0;
  let fluency='Below Basic';
  if(pct>=95)fluency='Advanced';else if(pct>=85)fluency='Proficient';else if(pct>=70)fluency='Basic';
  const errDet=b.errorDetails?(typeof b.errorDetails==='string'?b.errorDetails:JSON.stringify(b.errorDetails)):null;
  try {
    await db.execute(
      `UPDATE task2_results SET session_uuid=COALESCE(?,session_uuid),
         child_name=COALESCE(?,child_name),child_grade=COALESCE(?,child_grade),
         total_words=?,correct_words=?,error_count=?,percentage=?,fluency_level=?,
         reading_speed_wpm=?,time_used_seconds=?,finished_early=?,error_details=?,
         is_partial=?,updated_at=NOW() WHERE id=?`,
      [b.sessionUUID||null,b.childName||null,b.childGrade||null,
       tw,cw,b.errorCount||0,pct,fluency,wpm,tu,b.finishedEarly?1:0,errDet,b.is_partial?1:0,id]
    );
    return res.json({ success:true });
  } catch(err) { console.error('task2 PATCH error:',err); return res.status(500).json({ success:false, error:'Database error.' }); }
});

router.get('/results', async (req, res) => {
  const { sessionUUID, childName, parentId } = req.query;
  try {
    let sql, params;
    if(sessionUUID){sql='SELECT * FROM task2_results WHERE session_uuid=? ORDER BY completed_at DESC';params=[sessionUUID];}
    else if(childName&&parentId){sql=`SELECT t.* FROM task2_results t JOIN child_info_sessions s ON s.session_uuid=t.session_uuid WHERE s.child_name=? AND s.parent_id=? ORDER BY t.completed_at DESC`;params=[childName,parentId];}
    else return res.status(400).json({success:false,error:'Provide sessionUUID or childName+parentId.'});
    const [rows]=await db.execute(sql,params);
    return res.json({success:true,results:rows});
  } catch(err){return res.status(500).json({success:false,error:'Database error.'});}
});

module.exports = router;