// server.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const pool         = require('./db');

// ── Routers ───────────────────────────────────────────────────
const authRouter        = require('./routes/auth');          // ← new
const parentsRouter     = require('./routes/parents');
const childrenRouter    = require('./routes/children');
const assessmentsRouter = require('./routes/assessments');
const activitiesRouter  = require('./routes/activities');
const therapistsRouter  = require('./routes/therapists');
const dashboardRouter   = require('./routes/dashboard');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,                          // required for httpOnly cookie
    methods:      ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Core middleware ───────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());                        // needed to read refresh token cookie

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });
}

// ── Rate limiter (login + auth routes) ───────────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders:   false,
    skipFailedRequests: true, // Skip rate limiting for failed requests
});

app.use('/api/auth/login',            loginLimiter);
app.use('/api/auth/forgot-password',  loginLimiter);
app.use('/api/parents/login',         loginLimiter);
app.use('/api/therapists/login',      loginLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRouter);        // login, logout, refresh, forgot/reset-password
app.use('/api/parents',     parentsRouter);
app.use('/api/children',    childrenRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/activities',  activitiesRouter);
app.use('/api/therapists',  therapistsRouter);
app.use('/api/dashboard',   dashboardRouter);

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ── DB status ─────────────────────────────────────────────────
app.get('/api/db-status', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        await conn.query('SELECT 1');
        conn.release();
        res.json({ status: 'Database connected' });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log(' Dyslexia Support Platform — Backend v2');
    console.log(` Port : ${PORT}  |  Env: ${process.env.NODE_ENV || 'development'}`);
    console.log(` CORS : ${allowedOrigins.join(', ')}`);
    console.log('========================================');
    console.log(' POST /api/auth/login');
    console.log(' POST /api/auth/logout          [protected]');
    console.log(' POST /api/auth/refresh');
    console.log(' POST /api/auth/forgot-password');
    console.log(' POST /api/auth/reset-password');
    console.log(' GET  /api/therapists/audit-log [protected: therapist]');
    console.log(' GET  /api/dashboard/students   [protected: therapist]');
    console.log(' GET  /api/dashboard/activity   [protected: therapist]');
    console.log(' GET  /api/dashboard/notes      [protected: therapist]');
    console.log(' POST /api/dashboard/notes      [protected: therapist]');
    console.log(' GET  /api/children             [protected: parent]');
    console.log('========================================');
});