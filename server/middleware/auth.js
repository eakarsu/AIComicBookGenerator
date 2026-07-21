'use strict';
const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
};
