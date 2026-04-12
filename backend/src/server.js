require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const bcrypt       = require('bcrypt');
const pool         = require('./db');

// ── Routes ────────────────────────────────────────────────────
const parentsRouter     = require('./routes/parents');
const childrenRouter    = require('./routes/children');
const assessmentsRouter = require('./routes/assessments');
const activitiesRouter  = require('./routes/activities');
const therapistsRouter  = require('./routes/therapists');
const dashboardRouter   = require('./routes/dashboard');

const { generateToken } = require('./middleware/auth');

const app = express();

// ── Security: CORS ────────────────────────────────────────────
// FIX: was app.use(cors()) — allowed every origin (security hole)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server calls (no Origin header) and whitelisted origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Core middleware ───────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Request logger (dev only) ─────────────────────────────────
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

// ── Rate limiter (shared for all login endpoints) ─────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ──────────────────────────────────────────────────────────────
// UNIFIED LOGIN  →  POST /api/auth/login
//
// Checks Therapist first, then Parent.
// Backend decides the role — frontend just follows.
// ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Normalise email so casing never causes a mismatch
        const normalEmail = email.trim().toLowerCase();

        const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        // ── 1. Check Therapist ────────────────────────────────
        const [therapists] = await pool.query(
            'SELECT id, username, email, password_hash FROM Therapist WHERE LOWER(email) = ?',
            [normalEmail]
        );

        if (therapists.length > 0) {
            const therapist = therapists[0];
            const match = await bcrypt.compare(password, therapist.password_hash);

            if (!match) {
                // Log failed attempt — fire-and-forget, don't block the response
                pool.query(
                    'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                    [therapist.id, 'therapist', 'login_failure', ipAddress, userAgent]
                ).catch(e => console.error('AuditLog insert error:', e.message));

                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Update login stats & log success in parallel
            await Promise.all([
                pool.query(
                    'UPDATE Therapist SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
                    [ipAddress, therapist.id]
                ),
                pool.query(
                    'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                    [therapist.id, 'therapist', 'login_success', ipAddress, userAgent]
                ),
            ]);

            // Re-fetch fresh stats after the update
            const [[fresh]] = await pool.query(
                'SELECT login_count, last_login FROM Therapist WHERE id = ?',
                [therapist.id]
            );

            const token = generateToken({
                id:    therapist.id,
                role:  'therapist',
                email: therapist.email,
                name:  therapist.username,
            });

            console.log(`✅ Therapist login: ${therapist.email} (id=${therapist.id})`);

            // FIX: unified response shape — always use 'userId', never 'therapistId'
            return res.json({
                token,
                userId:     therapist.id,
                email:      therapist.email,
                role:       'therapist',
                name:       therapist.username,
                loginCount: fresh.login_count,
                lastLogin:  fresh.last_login,
                message:    'Login successful',
            });
        }

        // ── 2. Check Parent ───────────────────────────────────
        const [parents] = await pool.query(
            'SELECT id, full_name, email, password_hash FROM Parent WHERE LOWER(email) = ?',
            [normalEmail]
        );

        if (parents.length > 0) {
            const parent = parents[0];
            const match = await bcrypt.compare(password, parent.password_hash);

            if (!match) {
                pool.query(
                    'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                    [parent.id, 'parent', 'login_failure', ipAddress, userAgent]
                ).catch(e => console.error('AuditLog insert error:', e.message));

                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Update parent login stats
            await Promise.all([
                pool.query(
                    'UPDATE Parent SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
                    [ipAddress, parent.id]
                ),
                pool.query(
                    'INSERT INTO AuditLog (user_id, user_role, event_type, ip_address, user_agent) VALUES (?,?,?,?,?)',
                    [parent.id, 'parent', 'login_success', ipAddress, userAgent]
                ),
            ]);

            const token = generateToken({
                id:    parent.id,
                role:  'parent',
                email: parent.email,
                name:  parent.full_name,
            });

            console.log(`✅ Parent login: ${parent.email} (id=${parent.id})`);

            // FIX: unified response shape — always use 'userId'
            return res.json({
                token,
                userId:  parent.id,
                email:   parent.email,
                role:    'parent',
                name:    parent.full_name,
                message: 'Login successful',
            });
        }

        // ── 3. Not found ──────────────────────────────────────
        return res.status(401).json({ error: 'Invalid email or password' });

    } catch (err) {
        console.error('Unified login error:', err);
        res.status(500).json({ error: 'Login failed' });
        // FIX: never expose err.message to the client in production
    }
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status:    'Dyslexia Platform Backend is running!',
        timestamp: new Date().toISOString(),
        version:   '2.0.0',
    });
});

// ── Rate limit individual login routes (kept for compatibility) ─
app.use('/api/parents/login',    loginLimiter);
app.use('/api/therapists/login', loginLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/parents',     parentsRouter);
app.use('/api/children',    childrenRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/activities',  activitiesRouter);
app.use('/api/therapists',  therapistsRouter);
app.use('/api/dashboard',   dashboardRouter);

// ── DB status (internal use — protect in production) ─────────
app.get('/api/db-status', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [result] = await conn.query('SELECT 1 + 1 AS result');
        conn.release();
        res.json({ status: 'Database connected', dbTest: result[0] });
    } catch (error) {
        console.error('DB connection error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// ── REMOVED: /debug-therapist ─────────────────────────────────
// FIX: this route returned raw password_hash with no auth — CRITICAL
// security hole. Deleted permanently.

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
    // FIX: never leak err.message to client
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log(' Dyslexia Support Platform — Backend');
    console.log(` Port      : ${PORT}`);
    console.log(` Env       : ${process.env.NODE_ENV || 'development'}`);
    console.log(` CORS      : ${allowedOrigins.join(', ')}`);
    console.log('========================================');
    console.log(' Routes:');
    console.log('  POST /api/auth/login          ← UNIFIED (therapist + parent)');
    console.log('  POST /api/parents/register');
    console.log('  POST /api/parents/login');
    console.log('  POST /api/therapists/login');
    console.log('  POST /api/therapists/register');
    console.log('  GET  /api/therapists/audit-log      [protected: therapist]');
    console.log('  GET  /api/dashboard/students        [protected: therapist]');
    console.log('  POST /api/dashboard/students        [protected: therapist]');
    console.log('  GET  /api/dashboard/activity        [protected: therapist]');
    console.log('  GET  /api/dashboard/notes           [protected: therapist]');
    console.log('  POST /api/dashboard/notes           [protected: therapist]');
    console.log('  GET  /api/children                  [protected]');
    console.log('  GET  /api/assessments/child/:id     [protected]');
    console.log('  GET  /api/activities                [protected]');
    console.log('========================================');
});