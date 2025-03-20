// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('config');
/*
module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('jwtSecret'));

    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
*/
// Temporary simplified auth middleware for testing
// server/middleware/auth.js
module.exports = function(req, res, next) {
  console.log('Auth middleware bypassed for testing');
  req.user = { 
    id: '67d9283bf94ed4385ccc7b04', // Make sure this matches your admin user ID
    name: 'Admin User',
    role: 'admin' 
  };
  next();
};