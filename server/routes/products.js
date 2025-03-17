// routes/products.js
const express = require('express');

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', [auth, roleAuth('admin')], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product has inventory
    if (product.currentStock > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with existing inventory. Deactivate it instead.' 
      });
    }
    
    // Remove product from supplier's product list if applicable
    if (product.supplier) {
      await Supplier.findByIdAndUpdate(
        product.supplier,
        { $pull: { productsSupplied: product._id } }
      );
    }
    
    // Delete product
    await product.remove();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/products/:id/stock
// @desc    Update product stock directly (admin override)
// @access  Private/Admin
router.put(
  '/:id/stock',
  [
    auth,
    roleAuth(['admin', 'manager']),
    [
      check('currentStock', 'Current stock is required').isNumeric()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const { currentStock, notes } = req.body;
      const previousStock = product.currentStock;
      
      // Update stock
      product.currentStock = currentStock;
      await product.save();
      
      // Create inventory movement record
      const InventoryMovement = require('../models/InventoryMovement');
      const movement = new InventoryMovement({
        product: product._id,
        barcode: product.barcode,
        movementType: 'Adjustment',
        quantity: Math.abs(currentStock - previousStock),
        previousStock,
        newStock: currentStock,
        notes: notes || 'Stock adjustment by administrator',
        performedBy: req.user.id
      });
      
      await movement.save();
      
      res.json({
        message: 'Product stock updated successfully',
        product,
        movement
      });
    } catch (err) {
      console.error('Error updating product stock:', err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET api/products/stats/overview
// @desc    Get product statistics and overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    // Get total product count
    const totalProducts = await Product.countDocuments();
    
    // Get active product count
    const activeProducts = await Product.countDocuments({ isActive: true });
    
    // Get low stock count
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
      isActive: true
    });
    
    // Get out of stock count
    const outOfStockProducts = await Product.countDocuments({
      currentStock: 0,
      isActive: true
    });
    
    // Get product count by category
    const categoryBreakdown = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get total inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: null, 
          costValue: { $sum: { $multiply: ['$costPrice', '$currentStock'] } },
          retailValue: { $sum: { $multiply: ['$sellingPrice', '$currentStock'] } }
        } 
      }
    ]);
    
    res.json({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      categoryBreakdown: categoryBreakdown.map(cat => ({
        category: cat._id,
        count: cat.count
      })),
      inventoryValue: inventoryValue.length > 0 ? {
        costValue: inventoryValue[0].costValue,
        retailValue: inventoryValue[0].retailValue
      } : {
        costValue: 0,
        retailValue: 0
      }
    });
  } catch (err) {
    console.error('Error fetching product statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @route   GET api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Build query based on filters
    const query = {};
    
    // Check for category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Check for active filter
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }
    
    // Check for search term
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { barcode: searchRegex },
        { 'plantDetails.scientificName': searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Check for stock filter
    if (req.query.lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
    }
    
    // Find products with optional populate of supplier
    let productsQuery = Product.find(query);
    
    if (req.query.includeSupplier === 'true') {
      productsQuery = productsQuery.populate('supplier', 'name contactPerson');
    }
    
    // Sort option
    const sortField = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    productsQuery = productsQuery.sort({ [sortField]: sortOrder });
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    productsQuery = productsQuery.skip(skip).limit(limit);
    
    // Execute query
    const products = await productsQuery;
    
    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/products/categories
// @desc    Get all product categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    // Get unique categories
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name contactPerson');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/products
// @desc    Create a product
// @access  Private/Manager, Admin
router.post(
  '/',
  [
    auth,
    roleAuth(['admin', 'manager', 'inventory']),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('barcode', 'Barcode is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('costPrice', 'Cost price is required').isNumeric(),
      check('sellingPrice', 'Selling price is required').isNumeric()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Check if product with barcode already exists
      const existingProduct = await Product.findOne({ barcode: req.body.barcode });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this barcode already exists' });
      }
      
      // Destructure product data from request
      const {
        name,
        barcode,
        category,
        subcategory,
        description,
        supplier,
        costPrice,
        sellingPrice,
        taxRate,
        currentStock,
        minimumStock,
        location,
        plantDetails,
        images,
        isActive
      } = req.body;
      
      // Create new product
      const product = new Product({
        name,
        barcode,
        category,
        subcategory,
        description,
        supplier,
        costPrice,
        sellingPrice,
        taxRate: taxRate || 15, // Default to 15% GST
        currentStock: currentStock || 0,
        minimumStock: minimumStock || 5,
        location,
        plantDetails,
        images,
        isActive: isActive !== undefined ? isActive : true
      });
      
      // Save product
      await product.save();
      
      // If supplier is provided, add product to supplier's productsSupplied
      if (supplier) {
        const supplierDoc = await Supplier.findById(supplier);
        if (supplierDoc) {
          supplierDoc.productsSupplied.push(product._id);
          await supplierDoc.save();
        }
      }
      
      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private/Manager, Admin
router.put(
  '/:id',
  [
    auth,
    roleAuth(['admin', 'manager', 'inventory']),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('costPrice', 'Cost price is required').isNumeric(),
      check('sellingPrice', 'Selling price is required').isNumeric()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Find product
      let product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // If barcode is changed, check if it conflicts with another product
      if (req.body.barcode && req.body.barcode !== product.barcode) {
        const barcodeExists = await Product.findOne({ 
          barcode: req.body.barcode,
          _id: { $ne: req.params.id }
        });
        
        if (barcodeExists) {
          return res.status(400).json({ message: 'Barcode already in use by another product' });
        }
      }
      
      // Update supplier relation if it has changed
      if (req.body.supplier && product.supplier.toString() !== req.body.supplier) {
        // Remove product from old supplier if there was one
        if (product.supplier) {
          await Supplier.findByIdAndUpdate(
            product.supplier,
            { $pull: { productsSupplied: product._id } }
          );
        }
        
        // Add product to new supplier
        await Supplier.findByIdAndUpdate(
          req.body.supplier,
          { $addToSet: { productsSupplied: product._id } }
        );
      }
      
      // Update product fields
      const {
        name,
        barcode,
        category,
        subcategory,
        description,
        supplier,
        costPrice,
        sellingPrice,
        taxRate,
        minimumStock,
        location,
        plantDetails,
        images,
        isActive
      } = req.body;
      
      // Update product (currentStock is not updated here, use inventory movements instead)
      product.name = name || product.name;
      product.barcode = barcode || product.barcode;
      product.category = category || product.category;
      product.subcategory = subcategory || product.subcategory;
      product.description = description || product.description;
      product.supplier = supplier || product.supplier;
      product.costPrice = costPrice || product.costPrice;
      product.sellingPrice = sellingPrice || product.sellingPrice;
      product.taxRate = taxRate || product.taxRate;
      product.minimumStock = minimumStock !== undefined ? minimumStock : product.minimumStock;
      product.location = location || product.location;
      
      // Update plant details if provided
      if (plantDetails) {
        product.plantDetails = {
          ...product.plantDetails || {},
          ...plantDetails
        };
      }
      
      // Update images if provided
      if (images) {
        product.images = images;
      }
      
      // Update active status if provided
      if (isActive !== undefined) {
        product.isActive = isActive;
      }
      
      // Save product
      await product.save();
      
      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (err) {
      console.error('Error updating product:', err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);