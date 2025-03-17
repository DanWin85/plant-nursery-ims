// routes/suppliers.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// @route   GET api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Build query
    const query = {};
    
    // Check for active filter
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }
    
    // Check for search term
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Sort option
    const sortField = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Find suppliers
    const suppliers = await Supplier.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await Supplier.countDocuments(query);
    
    res.json({
      suppliers,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error('Error fetching supplier:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/suppliers/:id/products
// @desc    Get products from a supplier
// @access  Private
router.get('/:id/products', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Get products from this supplier
    const products = await Product.find({ supplier: req.params.id });
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching supplier products:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Private/Manager, Admin
router.post(
  '/',
  [
    auth,
    roleAuth(['admin', 'manager']),
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
      // Destructure supplier data
      const {
        name,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        website,
        notes,
        leadTime,
        paymentTerms,
        isActive
      } = req.body;
      
      // Create new supplier
      const supplier = new Supplier({
        name,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        website,
        notes,
        leadTime: leadTime || 7,
        paymentTerms: paymentTerms || 'Net 30',
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Save supplier
      await supplier.save();
      
      res.status(201).json({
        message: 'Supplier created successfully',
        supplier
      });
    } catch (err) {
      console.error('Error creating supplier:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Private/Manager, Admin
router.put(
  '/:id',
  [
    auth,
    roleAuth(['admin', 'manager']),
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
      // Find supplier
      let supplier = await Supplier.findById(req.params.id);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      // Destructure supplier data
      const {
        name,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        website,
        notes,
        leadTime,
        paymentTerms,
        isActive
      } = req.body;
      
      // Update supplier fields
      supplier.name = name || supplier.name;
      supplier.contactPerson = contactPerson || supplier.contactPerson;
      supplier.email = email || supplier.email;
      supplier.phone = phone || supplier.phone;
      
      if (address) {
        supplier.address = {
          ...supplier.address || {},
          ...address
        };
      }
      
      supplier.taxId = taxId || supplier.taxId;
      supplier.website = website || supplier.website;
      supplier.notes = notes || supplier.notes;
      supplier.leadTime = leadTime || supplier.leadTime;
      supplier.paymentTerms = paymentTerms || supplier.paymentTerms;
      
      // Update active status if provided
      if (isActive !== undefined) {
        supplier.isActive = isActive;
      }
      
      // Save supplier
      await supplier.save();
      
      res.json({
        message: 'Supplier updated successfully',
        supplier
      });
    } catch (err) {
      console.error('Error updating supplier:', err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Private/Admin
router.delete('/:id', [auth, roleAuth('admin')], async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if supplier has products
    const productsCount = await Product.countDocuments({ supplier: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete supplier with associated products. Deactivate it instead.' 
      });
    }
    
    // Delete supplier
    await supplier.remove();
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;