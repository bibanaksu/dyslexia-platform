const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dyslexia_jwt_secret_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireTherapist(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Therapist access required' });
    }
    next();
  });
}

function requireParent(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Parent access required' });
    }
    next();
  });
}

function requireAuth(req, res, next) {
  verifyToken(req, res, next);
}

module.exports = { generateToken, verifyToken, requireTherapist, requireParent, requireAuth };
