// routes/customers.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

// @route   GET api/customers
// @desc    Get all customers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Build query based on filters
    const query = {};
    
    // Check for active filter
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }
    
    // Check for commercial filter
    if (req.query.commercial !== undefined) {
      query.isCommercial = req.query.commercial === 'true';
    }
    
    // Check for membership level filter
    if (req.query.membershipLevel) {
      query.membershipLevel = req.query.membershipLevel;
    }
    
    // Check for search term
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'address.street': searchRegex },
        { 'address.city': searchRegex },
        { 'commercialDetails.companyName': searchRegex }
      ];
    }
    
    // Sort option
    const sortField = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Find customers
    const customers = await Customer.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await Customer.countDocuments(query);
    
    res.json({
      customers,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/customers/:id/sales
// @desc    Get sales for a customer
// @access  Private
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Find sales for this customer
    const sales = await Sale.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(sales);
  } catch (err) {
    console.error('Error fetching customer sales:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/customers
// @desc    Create a customer
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const {
        name,
        email,
        phone,
        address,
        notes,
        membershipLevel,
        isCommercial,
        commercialDetails,
        isActive
      } = req.body;
      
      // Check if email exists and is unique
      if (email) {
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
          return res.status(400).json({ message: 'Customer with this email already exists' });
        }
      }
      
      // Create new customer
      const customer = new Customer({
        name,
        email,
        phone,
        address,
        notes,
        membershipLevel: membershipLevel || 'Regular',
        isCommercial: isCommercial || false,
        commercialDetails: isCommercial ? commercialDetails : undefined,
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Save customer
      await customer.save();
      
      res.status(201).json({
        message: 'Customer created successfully',
        customer
      });
    } catch (err) {
      console.error('Error creating customer:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Find customer
      let customer = await Customer.findById(req.params.id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Check email uniqueness if changed
      if (req.body.email && req.body.email !== customer.email) {
        const existingCustomer = await Customer.findOne({ email: req.body.email });
        if (existingCustomer) {
          return res.status(400).json({ message: 'Customer with this email already exists' });
        }
      }
      
      // Update customer fields
      const {
        name,
        email,
        phone,
        address,
        notes,
        membershipLevel,
        loyaltyPoints,
        isCommercial,
        commercialDetails,
        isActive
      } = req.body;
      
      customer.name = name || customer.name;
      customer.email = email || customer.email;
      customer.phone = phone || customer.phone;
      
      if (address) {
        customer.address = {
          ...customer.address || {},
          ...address
        };
      }
      
      customer.notes = notes || customer.notes;
      customer.membershipLevel = membershipLevel || customer.membershipLevel;
      
      if (loyaltyPoints !== undefined) {
        customer.loyaltyPoints = loyaltyPoints;
      }
      
      if (isCommercial !== undefined) {
        customer.isCommercial = isCommercial;
      }
      
      if (isCommercial && commercialDetails) {
        customer.commercialDetails = {
          ...customer.commercialDetails || {},
          ...commercialDetails
        };
      }
      
      if (isActive !== undefined) {
        customer.isActive = isActive;
      }
      
      // Save customer
      await customer.save();
      
      res.json({
        message: 'Customer updated successfully',
        customer
      });
    } catch (err) {
      console.error('Error updating customer:', err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private/Admin
router.delete('/:id', [auth, roleAuth('admin')], async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if customer has sales
    const salesCount = await Sale.countDocuments({ customer: req.params.id });
    
    if (salesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with sales history. Deactivate it instead.' 
      });
    }
    
    // Delete customer
    await customer.remove();
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;