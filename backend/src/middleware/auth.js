const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dyslexia_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Generate JWT token
const generateToken = (parentId) => {
  return jwt.sign(
    { parentId },
    process.env.JWT_SECRET || 'dyslexia_secret_key',
    { expiresIn: '24h' }
  );
};

module.exports = {
  verifyToken,
  generateToken
};
