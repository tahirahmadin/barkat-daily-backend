const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const store = require('../store');

/**
 * Verify JWT and attach req.user (userId).
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * No login required: attach req.user with the fixed user id (tahir@sayy.ai).
 */
function fixedUserMiddleware(req, res, next) {
  req.user = { userId: store.getFixedUserId() };
  next();
}

/**
 * Optional auth: attach req.user when valid Bearer token present; otherwise req.user is undefined.
 */
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { userId: decoded.userId };
    next();
  } catch {
    next();
  }
}

module.exports = { authMiddleware, fixedUserMiddleware, optionalAuthMiddleware };
