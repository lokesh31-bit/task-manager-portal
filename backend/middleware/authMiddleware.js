const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_super_secret_key_12345';
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
