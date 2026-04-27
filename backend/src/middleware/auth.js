const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function generateToken(payload) {
    console.log('🔐 Generating token for payload:', { ...payload, role: payload.role });
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

function refreshTokenExpiresAt() {
    const now = new Date();
    const days = parseInt(process.env.REFRESH_TOKEN_DAYS) || 7;
    now.setDate(now.getDate() + days);
    return now;
}

function resetTokenExpiresAt(minutes = 15) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
}

function setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: (parseInt(process.env.REFRESH_TOKEN_DAYS) || 7) * 24 * 60 * 60 * 1000,
    });
}

function clearRefreshCookie(res) {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
}

// Middleware to verify JWT tokens
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Access token required' });
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const token = parts[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

function requireAuth(req, res, next) {
    return verifyToken(req, res, next);
}

function requireParent(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'parent') {
        return res.status(403).json({ error: 'Parent access required' });
    }
    next();
}

function requireTherapist(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'therapist') {
        return res.status(403).json({ error: 'Therapist access required' });
    }
    next();
}

module.exports = {
    generateToken,
    generateRefreshToken,
    refreshTokenExpiresAt,
    resetTokenExpiresAt,
    setRefreshCookie,
    clearRefreshCookie,
    verifyToken,
    requireAuth,
    requireParent,
    requireTherapist,
};