require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const pool = require('./db');

// Import routes
const parentsRouter     = require('./routes/parents');
const childrenRouter    = require('./routes/children');
const assessmentsRouter = require('./routes/assessments');
const activitiesRouter  = require('./routes/activities');
const therapistsRouter  = require('./routes/therapists');
const dashboardRouter   = require('./routes/dashboard');   // ← NEW
const quizRouter        = require('./routes/quiz');

const { generateToken } = require('./middleware/auth');

const app = express();

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ──────────────────────────────────────────────────────────────
// UNIFIED LOGIN  →  POST /api/auth/login
// ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        // ── 1. Check Therapist ────────────────────────────────
        const [therapists] = await pool.query(
            'SELECT id, username, email, password_hash FROM Therapist WHERE email = ?',
            [email]
        );

        if (therapists.length > 0) {
            const therapist = therapists[0];
            const match = await bcrypt.compare(password, therapist.password_hash);

            if (!match) {
                await pool.query(
                    'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                    [therapist.id, 'therapist', 'login_failure', ipAddress, userAgent]
                );
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            await pool.query(
                'UPDATE Therapist SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
                [ipAddress, therapist.id]
            );
            await pool.query(
                'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                [therapist.id, 'therapist', 'login_success', ipAddress, userAgent]
            );

            const [updated] = await pool.query(
                'SELECT login_count, last_login FROM Therapist WHERE id = ?',
                [therapist.id]
            );

            const token = generateToken({
                id: therapist.id,
                role: 'therapist',
                email: therapist.email,
                name: therapist.username,
            });

            console.log(`✅ Therapist login: ${therapist.email} (id=${therapist.id})`);

            return res.json({
                token,
                userId: therapist.id,
                email: therapist.email,
                role: 'therapist',
                name: therapist.username,
                loginCount: updated[0].login_count,
                lastLogin: updated[0].last_login,
                message: 'Login successful',
            });
        }

        // ── 2. Check Parent ───────────────────────────────────
        const [parents] = await pool.query(
            'SELECT id, full_name, email, password_hash FROM Parent WHERE email = ?',
            [email]
        );

        if (parents.length > 0) {
            const parent = parents[0];
            const match = await bcrypt.compare(password, parent.password_hash);

            if (!match) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = generateToken({
                id: parent.id,
                role: 'parent',
                email: parent.email,
                name: parent.full_name,
            });

            console.log(`✅ Parent login: ${parent.email} (id=${parent.id})`);

            return res.json({
                token,
                userId: parent.id,
                email: parent.email,
                role: 'parent',
                name: parent.full_name,
                message: 'Login successful',
            });
        }

        // ── 3. Not found ──────────────────────────────────────
        return res.status(401).json({ error: 'Invalid email or password' });

    } catch (err) {
        console.error('Unified login error:', err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Dyslexia Platform Backend is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// Rate limiting on individual login routes (kept for compatibility)
app.use('/api/parents/login',    loginLimiter);
app.use('/api/therapists/login', loginLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/parents',     parentsRouter);
app.use('/api/children',    childrenRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/activities',  activitiesRouter);
app.use('/api/therapists',  therapistsRouter);
app.use('/api/dashboard',   dashboardRouter);   // ← NEW
app.use('/api/quiz',        quizRouter);

// DB status
app.get('/api/db-status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('SELECT 1 + 1 as result');
        connection.release();
        res.json({ status: 'Database connected successfully', dbTest: result[0] });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});
app.get('/debug-therapist', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, email, password_hash FROM Therapist');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 404 handler — must be last
app.use((req, res) => {
    console.log('404 for URL:', req.method, req.url);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Dyslexia Support Platform Backend`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
    console.log(`Available Routes:`);
    console.log(`- GET  /api/health`);
    console.log(`- GET  /api/db-status`);
    console.log(`- POST /api/auth/login              ← UNIFIED`);
    console.log(`- POST /api/parents/login`);
    console.log(`- POST /api/parents/register`);
    console.log(`- POST /api/therapists/login`);
    console.log(`- POST /api/therapists/register`);
    console.log(`- GET  /api/therapists/audit-log    (protected)`);
    console.log(`- GET  /api/dashboard/students      (protected)`);
    console.log(`- POST /api/dashboard/students      (protected)`);
    console.log(`- GET  /api/dashboard/activity      (protected)`);
    console.log(`- GET  /api/dashboard/notes         (protected)`);
    console.log(`- POST /api/dashboard/notes         (protected)`);
    console.log(`- GET  /api/children`);
    console.log(`- GET  /api/assessments/child/:id`);
    console.log(`- GET  /api/activities`);
    console.log(`- POST /api/quiz/submit             (public + optional auth)`);
    console.log(`- GET  /api/quiz/results/:parentId  (protected)`);
    console.log(`========================================`);
});