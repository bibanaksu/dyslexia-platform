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
const therapistRouter         = require('./routes/therapist');
const dashboardRouter         = require('./routes/dashboard');
const quizRouter              = require('./routes/quiz');
const taskThreeRouter         = require('./routes/taskThree');
const taskFourRouter          = require('./routes/Taskfour');
const childInfoRoutes         = require('./routes/childInfoRoutes');
const task1Routes             = require('./routes/Task1routes');
const task2Routes             = require('./routes/Task2routes');
const assessmentSummaryRoutes = require('./routes/assessmentSummaryRoutes.js');
const authRouter              = require('./routes/auth');
const authGoogleRouter        = require('./routes/auth_google');
const messagesRouter          = require('./routes/messages');
const taskDetailsRouter       = require('./routes/taskDetails'); // ✅ ADDED

// ✨ Spelling activity routes
const spellingActivityRoutes  = require('./routes/spellingActivityRoutes');

const { generateToken, verifyToken } = require('./middleware/auth');
const app = express();

const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10, message:{error:'Too many attempts.'}, standardHeaders:true, legacyHeaders:false });

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004', 
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req,res,next)=>{ console.log(`${req.method} ${req.url}`); next(); });

// ─────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/auth', authGoogleRouter);


// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/assessments/task2',  task2Routes);
app.use('/api/assessments',        assessmentsRouter);
app.use('/api/task1',              task1Routes);
app.use('/api/task3',              taskThreeRouter);
app.use('/api/task4',              taskFourRouter);
app.use('/api/parents',            parentsRouter);
app.use('/api/children',           childrenRouter);
app.use('/api/activities',         activitiesRouter);
app.use('/api/therapist',          therapistRouter);
app.use('/api/dashboard',          dashboardRouter);
app.use('/api/quiz',               quizRouter);
app.use('/api/child-info',         childInfoRoutes);
app.use('/api/assessment',         assessmentSummaryRoutes);
app.use('/api/messages',           messagesRouter);
app.use('/api/spelling',           spellingActivityRoutes);
app.use('/api/task-details',       taskDetailsRouter);            // ✅ ADDED

// ─────────────────────────────────────────────────────────────
// NEW ROUTE: Get assignments for a specific child (accessible by both parent and therapist)
// ─────────────────────────────────────────────────────────────
app.get('/api/child-assignments/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // Permission check
    if (role === 'parent') {
      // Check if this child belongs to the parent
      const [parentCheck] = await pool.query(
        'SELECT id FROM child WHERE id = ? AND parent_id = ?',
        [childId, userId]
      );
      if (parentCheck.length === 0) {
        return res.status(403).json({ error: 'Access denied: child does not belong to you' });
      }
    } else if (role === 'therapist') {
      // Check if therapist is assigned to the parent of this child
      const [therapistCheck] = await pool.query(
        `SELECT c.id FROM child c
         JOIN parent p ON p.id = c.parent_id
         WHERE c.id = ? AND p.assigned_therapist_id = ?`,
        [childId, userId]
      );
      if (therapistCheck.length === 0) {
        return res.status(403).json({ error: 'Access denied: not assigned to this child' });
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    // Fetch assignments
    const [rows] = await pool.query(`
      SELECT cap.*, a.name AS activity_name, a.type, a.description, a.difficulty_level
      FROM child_activity_progress cap
      JOIN activity a ON a.id = cap.activity_id
      WHERE cap.child_id = ?
    `, [childId]);
    res.json({ assignments: rows });
  } catch (err) {
    console.error('GET /api/child-assignments/:childId error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// ─────────────────────────────────────────────────────────────
// DB status check (optional)
// ─────────────────────────────────────────────────────────────
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
  console.log(`  GET  /api/spelling/words        ← Spelling words`);
  console.log(`  POST /api/spelling/save         ← Save spelling score`);
  console.log(`  GET  /api/therapist/patients    ← Therapist dashboard`);
  console.log(`  GET  /api/therapist/notes       ← Therapist notes`);
  console.log(`  POST /api/therapist/assignments ← Assign activities`);
  console.log(`  GET  /api/child-assignments/:childId ← Shared assignments`);
  console.log(`  GET  /api/task-details/:childSessionId ← Detailed task data (public)`);
  console.log(`========================================\n`);
});