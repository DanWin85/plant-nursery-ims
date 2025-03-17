// middleware/roleAuth.js
const User = require('../models/User');

/**
 * Middleware to check if user has required role
 * @param {Array|String} roles - Required role(s) to access the resource
 */
module.exports = function(roles) {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return async (req, res, next) => {
    try {
      // Get user from database to ensure we have latest role
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'User account is inactive' });
      }
      
      // Check if user has required role
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Unauthorized. Required role: ' + roles.join(' or ') 
        });
      }
      
      // Add full user data to request
      req.user = user;
      next();
    } catch (err) {
      console.error('Role authorization error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
};