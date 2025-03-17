const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// @route   POST api/users
// @desc    Register a user
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    roleAuth('admin'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').isIn(['admin', 'manager', 'cashier', 'inventory'])
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, isActive } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
        role: role || 'cashier',
        isActive: isActive !== undefined ? isActive : true
      });

      // Save user to database
      await user.save();

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (err) {
      console.error('User registration error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', [auth, roleAuth(['admin', 'manager'])], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', [auth, roleAuth(['admin', 'manager'])], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    roleAuth('admin'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('role', 'Role is required').isIn(['admin', 'manager', 'cashier', 'inventory'])
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user fields
      const { name, email, role, isActive, password } = req.body;
      
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.isActive = isActive !== undefined ? isActive : user.isActive;
      
      // Only update password if provided
      if (password && password.length >= 6) {
        user.password = password;
      }
      
      await user.save();
      
      res.json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (err) {
      console.error('Update user error:', err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', [auth, roleAuth('admin')], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deletion of own account
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Users cannot delete their own account' });
    }
    
    await user.remove();
    
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;