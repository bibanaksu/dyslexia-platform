// backend/server.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const bcrypt       = require('bcrypt');
const pool         = require('./db');

const parentsRouter           = require('./routes/parents');
const childrenRouter          = require('./routes/children');
const assessmentsRouter       = require('./routes/assessments');
const activitiesRouter        = require('./routes/activities');
const therapistsRouter        = require('./routes/therapists');
const dashboardRouter         = require('./routes/dashboard');
const quizRouter              = require('./routes/quiz');
const taskThreeRouter         = require('./routes/taskThree');
const taskFourRouter          = require('./routes/Taskfour');
const childInfoRoutes         = require('./routes/childInfoRoutes');
const task1Routes             = require('./routes/Task1routes');
const task2Routes             = require('./routes/Task2routes');
const assessmentSummaryRoutes = require('./routes/Assessmentsummaryroutes.js');

const { generateToken } = require('./middleware/auth');
const app = express();

const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10, message:{error:'Too many attempts.'}, standardHeaders:true, legacyHeaders:false });

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use((req,res,next)=>{ console.log(`${req.method} ${req.url}`); next(); });

// ── UNIFIED LOGIN ──────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({error:'Email and password required'});
    const ip = req.ip||'unknown'; const ua = req.headers['user-agent']||'';

    const [therapists] = await pool.query('SELECT id,username,email,password_hash FROM Therapist WHERE email=?',[email]);
    if (therapists.length>0) {
      const t=therapists[0]; const ok=await bcrypt.compare(password,t.password_hash);
      if(!ok){await pool.query('INSERT INTO AuditLog(user_id,user_role,event_type,ip_address,user_agent)VALUES(?,?,?,?,?)',[t.id,'therapist','login_failure',ip,ua]);return res.status(401).json({error:'Invalid credentials'});}
      await pool.query('UPDATE Therapist SET login_count=login_count+1,last_login=NOW(),last_ip=? WHERE id=?',[ip,t.id]);
      await pool.query('INSERT INTO AuditLog(user_id,user_role,event_type,ip_address,user_agent)VALUES(?,?,?,?,?)',[t.id,'therapist','login_success',ip,ua]);
      const token=generateToken({id:t.id,role:'therapist',email:t.email,name:t.username});
      return res.json({token,userId:t.id,email:t.email,role:'therapist',name:t.username,message:'Login successful'});
    }
    const [parents] = await pool.query('SELECT id,full_name,email,password_hash FROM Parent WHERE email=?',[email]);
    if (parents.length>0) {
      const p=parents[0]; const ok=await bcrypt.compare(password,p.password_hash);
      if(!ok) return res.status(401).json({error:'Invalid credentials'});
      const token=generateToken({id:p.id,role:'parent',email:p.email,name:p.full_name});
      return res.json({token,userId:p.id,email:p.email,role:'parent',name:p.full_name,message:'Login successful'});
    }
    return res.status(401).json({error:'Invalid credentials'});
  } catch(err) { res.status(500).json({error:'Login failed',details:err.message}); }
});

app.get('/api/health',(req,res)=>res.json({status:'OK',timestamp:new Date().toISOString()}));

app.use('/api/parents/login',    loginLimiter);
app.use('/api/therapists/login', loginLimiter);

app.use('/api/parents',            parentsRouter);
app.use('/api/children',           childrenRouter);
app.use('/api/assessments',        assessmentsRouter);
app.use('/api/activities',         activitiesRouter);
app.use('/api/therapists',         therapistsRouter);
app.use('/api/dashboard',          dashboardRouter);
app.use('/api/quiz',               quizRouter);
app.use('/api/task3',              taskThreeRouter);
app.use('/api/task4',              taskFourRouter);
app.use('/api/child-info',         childInfoRoutes);
app.use('/api/task1',              task1Routes);
app.use('/api/assessments/task2',  task2Routes);
app.use('/api/assessment',         assessmentSummaryRoutes);

app.get('/api/db-status', async (req,res) => {
  try { const c=await pool.getConnection(); await c.query('SELECT 1'); c.release(); res.json({status:'Connected'}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

app.use((err,req,res,next)=>{ console.error(err); res.status(500).json({error:err.message}); });
app.use((req,res)=>res.status(404).json({error:`Route not found: ${req.method} ${req.url}`}));

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
  console.log(`\n========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Routes:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/child-info/session`);
  console.log(`  POST /api/task1/submit          ← UPSERT`);
  console.log(`  POST /api/assessments/task2/submit ← UPSERT`);
  console.log(`  POST /api/task3/submit          ← UPSERT`);
  console.log(`  POST /api/task4/submit          ← UPSERT`);
  console.log(`  GET  /api/assessment/summary/:uuid`);
  console.log(`========================================\n`);
});