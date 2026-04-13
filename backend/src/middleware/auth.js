const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // 15 minutes for access tokens
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // 7 days for refresh tokens

// Generate access token
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate refresh token (random string)
function generateRefreshToken() {
    return require('crypto').randomBytes(64).toString('hex');
}

// Get refresh token expiration date
function refreshTokenExpiresAt() {
    const now = new Date();
    // Default 7 days
    const days = parseInt(process.env.REFRESH_TOKEN_DAYS) || 7;
    now.setDate(now.getDate() + days);
    return now;
}

// Get reset token expiration date
function resetTokenExpiresAt(minutes = 15) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
}

// Set refresh token in httpOnly cookie
function setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: (parseInt(process.env.REFRESH_TOKEN_DAYS) || 7) * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
}

// Clear refresh token cookie
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
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

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

// Middleware to require authentication (alias for verifyToken)
function requireAuth(req, res, next) {
    return verifyToken(req, res, next);
}

// Middleware to require parent role
function requireParent(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'parent') {
        return res.status(403).json({ error: 'Parent access required' });
    }
    next();
}

// Middleware to require therapist role
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