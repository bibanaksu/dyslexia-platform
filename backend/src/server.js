// backend/server.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const bcrypt       = require('bcrypt');
const crypto       = require('crypto');
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
const authRouter              = require('./routes/auth');
const messagesRouter          = require('./routes/messages');  // ← ADD THIS LINE

const { generateToken } = require('./middleware/auth');
const app = express();

const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10, message:{error:'Too many attempts.'}, standardHeaders:true, legacyHeaders:false });

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use((req,res,next)=>{ console.log(`${req.method} ${req.url}`); next(); });

// ─────────────────────────────────────────────────────────────
// AUTH ROUTES — Mount the complete auth router
// This handles: /login, /refresh, /logout, /forgot-password, /reset-password
// ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ── Routes ───────────────────────────────────────────────────
// IMPORTANT: Order matters — specific routes BEFORE generic ones
app.use('/api/assessments/task2',  task2Routes);        // MUST be BEFORE assessmentsRouter
app.use('/api/assessments',        assessmentsRouter);
app.use('/api/task1',              task1Routes);
app.use('/api/task3',              taskThreeRouter);
app.use('/api/task4',              taskFourRouter);
app.use('/api/parents',            parentsRouter);
app.use('/api/children',           childrenRouter);
app.use('/api/activities',         activitiesRouter);
app.use('/api/therapists',         therapistsRouter);
app.use('/api/dashboard',          dashboardRouter);
app.use('/api/quiz',               quizRouter);
app.use('/api/child-info',         childInfoRoutes);
app.use('/api/assessment',         assessmentSummaryRoutes);
app.use('/api/messages',           messagesRouter);     // ← ADD THIS LINE

app.get('/api/db-status', async (req, res) => {
  try {
    const c = await pool.getConnection();
    await c.query('SELECT 1');
    c.release();
    res.json({ status: 'Connected' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Error handlers ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Routes:`);
  console.log(`  POST /api/auth/login           ← from authRouter`);
  console.log(`  POST /api/auth/refresh         ← from authRouter`);
  console.log(`  POST /api/auth/logout          ← from authRouter`);
  console.log(`  POST /api/auth/forgot-password ← from authRouter`);
  console.log(`  POST /api/auth/reset-password  ← from authRouter`);
  console.log(`  POST /api/child-info/session`);
  console.log(`  POST /api/task1/submit          ← UPSERT`);
  console.log(`  POST /api/assessments/task2/submit ← UPSERT`);
  console.log(`  POST /api/task3/submit          ← UPSERT`);
  console.log(`  POST /api/task4/submit          ← UPSERT`);
  console.log(`  GET  /api/assessment/summary/:uuid`);
  console.log(`  GET  /api/messages              ← Chat messages`);
  console.log(`  POST /api/messages              ← Send message`);
  console.log(`========================================\n`);
});