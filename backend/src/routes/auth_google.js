// Google Sign-In integration for existing app JWT session
// POST /api/auth/google

const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');

const {
  generateToken,
  generateRefreshToken,
  refreshTokenExpiresAt,
  setRefreshCookie,
} = require('../middleware/auth');

const router = express.Router();

function getClientInfo(req) {
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || '',
  };
}

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

function safeLowerEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function findOrCreateParentByEmail({ email, fullName }) {
  const normalEmail = safeLowerEmail(email);
  if (!normalEmail) throw new Error('Google account email is missing');

  const [[existing]] = await pool.query(
    'SELECT id, full_name, email FROM parent WHERE LOWER(email) = ?',
    [normalEmail]
  );

  if (existing) {
    return { id: existing.id, role: 'parent', email: existing.email, name: existing.full_name };
  }

  // Create new parent user.
  // Your DB schema expects password_hash; we generate a random one.
  const randomPassword = crypto.randomBytes(24).toString('hex');
  const bcrypt = require('bcrypt');
  const password_hash = await bcrypt.hash(randomPassword, 12);

  const displayName = fullName?.trim() || 'Google User';

  const [result] = await pool.query(
    `INSERT INTO parent (full_name, email, phone, password_hash)
     VALUES (?, ?, ?, ?)`,
    [displayName, normalEmail, '', password_hash]
  );

  const createdId = result.insertId;

  return { id: createdId, role: 'parent', email: normalEmail, name: displayName };
}

router.post('/google', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Missing env GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET');
      return res.status(500).json({ error: 'Server not configured for Google login' });
    }

    const redirectUri = `${FRONTEND_URL}/auth/google/callback`;

    // Helpful debug for env being loaded (DO NOT log tokens)
    console.log('[GoogleAuth] GOOGLE_CLIENT_ID (prefix):', String(GOOGLE_CLIENT_ID).slice(0, 8));

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const idToken = tokens?.id_token;
    if (!idToken) {
      return res.status(401).json({ error: 'Google did not return id_token' });
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const email = payload.email;
    const fullName = payload.name;


    const { ip, userAgent } = getClientInfo(req);

    const user = await findOrCreateParentByEmail({ email, fullName });

    await logAudit(user.id, user.role, 'google_login_success', ip, userAgent);

    const accessToken = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = refreshTokenExpiresAt();

    await pool.query(
      `INSERT INTO refresh_token (token, user_id, user_role, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [refreshToken, user.id, user.role, expiresAt, ip, userAgent]
    );

    setRefreshCookie(res, refreshToken);

    return res.json({
      token: accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      message: 'Google login successful',
    });
  } catch (err) {
    console.error('Google auth error:', err);

    const msg = err?.message || 'Google login failed';

    return res.status(401).json({
      error: msg,
      dev: process.env.NODE_ENV !== 'production' ? String(msg) : undefined,
    });
  }
});

module.exports = router;

