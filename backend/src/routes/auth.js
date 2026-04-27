// routes/auth.js
// ─────────────────────────────────────────────────────────────
//  Handles all stateful auth actions:
//    POST /api/auth/login            ← handles both parent & therapist
//    POST /api/auth/logout
//    POST /api/auth/refresh
//    POST /api/auth/forgot-password
//    POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────
const express = require('express');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const pool    = require('../db');
const {
    generateToken,
    generateRefreshToken,
    refreshTokenExpiresAt,
    resetTokenExpiresAt,
    setRefreshCookie,
    clearRefreshCookie,
    verifyToken,
} = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────
async function logAudit(userId, userRole, eventType, ipAddress, userAgent) {
    try {
        await pool.query(
            `INSERT INTO audit_log
             (user_id, user_role, event_type, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, userRole, eventType, ipAddress, userAgent]
        );
    } catch (e) {
        console.error('AuditLog error:', e.message);
    }
}

function getClientInfo(req) {
    return {
        ip:        req.ip || req.socket?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || '',
    };
}

// ══════════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalEmail       = email.trim().toLowerCase();
        const { ip, userAgent } = getClientInfo(req);

        // ── 1. Try Therapist ──────────────────────────────────
        const [[therapist]] = await pool.query(
            'SELECT id, username, email, password_hash FROM therapist WHERE LOWER(email) = ?',
            [normalEmail]
        );

        if (therapist) {
            const match = await bcrypt.compare(password, therapist.password_hash);

            if (!match) {
                await logAudit(therapist.id, 'therapist', 'login_failure', ip, userAgent);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            await pool.query(
                'UPDATE therapist SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
                [ip, therapist.id]
            );
            await logAudit(therapist.id, 'therapist', 'login_success', ip, userAgent);

            const [[fresh]] = await pool.query(
                'SELECT login_count, last_login FROM therapist WHERE id = ?',
                [therapist.id]
            );

            const accessToken  = generateToken({ id: therapist.id, role: 'therapist', email: therapist.email, name: therapist.username });
            const refreshToken = generateRefreshToken();
            const expiresAt    = refreshTokenExpiresAt();

            await pool.query(
                `INSERT INTO refresh_token (token, user_id, user_role, expires_at, ip_address, user_agent)
                 VALUES (?, ?, 'therapist', ?, ?, ?)`,
                [refreshToken, therapist.id, expiresAt, ip, userAgent]
            );

            setRefreshCookie(res, refreshToken);
            console.log(`✅ Therapist login: ${therapist.email} (id=${therapist.id})`);

            return res.json({
                token:      accessToken,
                userId:     therapist.id,
                email:      therapist.email,
                role:       'therapist',
                name:       therapist.username,
                loginCount: fresh.login_count,
                lastLogin:  fresh.last_login,
                message:    'Login successful',
            });
        }

        // ── 2. Try Parent ─────────────────────────────────────
        const [[parent]] = await pool.query(
            'SELECT id, full_name, email, password_hash FROM parent WHERE LOWER(email) = ?',
            [normalEmail]
        );

        if (parent) {
            const match = await bcrypt.compare(password, parent.password_hash);

            if (!match) {
                await logAudit(parent.id, 'parent', 'login_failure', ip, userAgent);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            await pool.query(
                'UPDATE parent SET login_count = login_count + 1, last_login = NOW(), last_ip = ? WHERE id = ?',
                [ip, parent.id]
            );
            await logAudit(parent.id, 'parent', 'login_success', ip, userAgent);

            const accessToken  = generateToken({ id: parent.id, role: 'parent', email: parent.email, name: parent.full_name });
            const refreshToken = generateRefreshToken();
            const expiresAt    = refreshTokenExpiresAt();

            await pool.query(
                `INSERT INTO refresh_token (token, user_id, user_role, expires_at, ip_address, user_agent)
                 VALUES (?, ?, 'parent', ?, ?, ?)`,
                [refreshToken, parent.id, expiresAt, ip, userAgent]
            );

            setRefreshCookie(res, refreshToken);
            console.log(`✅ Parent login: ${parent.email} (id=${parent.id})`);

            return res.json({
                token:      accessToken,
                userId:     parent.id,
                email:      parent.email,
                role:       'parent',
                name:       parent.full_name,
                message:    'Login successful',
            });
        }

        // ── 3. Not found ──────────────────────────────────────
        return res.status(401).json({ error: 'Invalid email or password' });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════════════════════════
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        const { ip, userAgent } = getClientInfo(req);

        if (refreshToken) {
            await pool.query(
                'UPDATE refresh_token SET revoked = TRUE WHERE token = ?',
                [refreshToken]
            );
        }

        await logAudit(req.user.id, req.user.role, 'logout', ip, userAgent);
        clearRefreshCookie(res);

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/refresh
// ══════════════════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ error: 'No refresh token' });
        }

        const [[row]] = await pool.query(
            `SELECT * FROM refresh_token
             WHERE token = ?
               AND revoked = FALSE
               AND expires_at > NOW()`,
            [token]
        );

        if (!row) {
            clearRefreshCookie(res);
            return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
        }

        let userPayload = null;

        if (row.user_role === 'therapist') {
            const [[t]] = await pool.query(
                'SELECT id, username, email FROM therapist WHERE id = ?',
                [row.user_id]
            );
            if (t) userPayload = { id: t.id, role: 'therapist', email: t.email, name: t.username };
        } else {
            const [[p]] = await pool.query(
                'SELECT id, full_name, email FROM parent WHERE id = ?',
                [row.user_id]
            );
            if (p) userPayload = { id: p.id, role: 'parent', email: p.email, name: p.full_name };
        }

        if (!userPayload) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        const newAccessToken = generateToken(userPayload);
        res.json({ token: newAccessToken });

    } catch (err) {
        console.error('Refresh error:', err);
        res.status(500).json({ error: 'Could not refresh session' });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ══════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalEmail = email.trim().toLowerCase();

        let userId   = null;
        let userRole = null;

        const [[therapist]] = await pool.query(
            'SELECT id FROM therapist WHERE LOWER(email) = ?',
            [normalEmail]
        );
        if (therapist) { userId = therapist.id; userRole = 'therapist'; }

        if (!userId) {
            const [[parent]] = await pool.query(
                'SELECT id FROM parent WHERE LOWER(email) = ?',
                [normalEmail]
            );
            if (parent) { userId = parent.id; userRole = 'parent'; }
        }

        if (!userId) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        await pool.query(
            `UPDATE password_reset_token SET used = TRUE
             WHERE user_id = ? AND user_role = ? AND used = FALSE`,
            [userId, userRole]
        );

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt  = resetTokenExpiresAt(15);

        await pool.query(
            `INSERT INTO password_reset_token (token, user_id, user_role, expires_at)
             VALUES (?, ?, ?, ?)`,
            [resetToken, userId, userRole, expiresAt]
        );

        const { ip, userAgent } = getClientInfo(req);
        await logAudit(userId, userRole, 'password_reset_request', ip, userAgent);

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        console.log(`🔑 Password reset link for ${normalEmail}: ${resetLink}`);

        res.json({
            message:   'If that email exists, a reset link has been sent.',
            devToken:  process.env.NODE_ENV !== 'production' ? resetToken : undefined,
            devLink:   process.env.NODE_ENV !== 'production' ? resetLink  : undefined,
        });

    } catch (err) {
        console.error('Forgot-password error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ══════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain at least one special character' });
        }

        const [[row]] = await pool.query(
            `SELECT * FROM password_reset_token
             WHERE token = ?
               AND used = FALSE
               AND expires_at > NOW()`,
            [token]
        );

        if (!row) {
            return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new one.' });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        const { ip, userAgent } = getClientInfo(req);

        if (row.user_role === 'therapist') {
            await pool.query(
                'UPDATE therapist SET password_hash = ? WHERE id = ?',
                [newHash, row.user_id]
            );
        } else {
            await pool.query(
                'UPDATE parent SET password_hash = ? WHERE id = ?',
                [newHash, row.user_id]
            );
        }

        await pool.query(
            'UPDATE password_reset_token SET used = TRUE WHERE id = ?',
            [row.id]
        );

        await pool.query(
            'UPDATE refresh_token SET revoked = TRUE WHERE user_id = ? AND user_role = ?',
            [row.user_id, row.user_role]
        );

        await logAudit(row.user_id, row.user_role, 'password_change', ip, userAgent);

        res.json({ message: 'Password reset successfully. Please log in with your new password.' });

    } catch (err) {
        console.error('Reset-password error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;