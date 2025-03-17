// routes/barcode.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const auth = require('../middleware/auth');

// Get product by barcode
router.get('/:barcode', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product by barcode:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle barcode scan to add product to POS
router.post('/scan', auth, async (req, res) => {
  try {
    const { barcode, quantity = 1 } = req.body;
    
    const product = await Product.findOne({ barcode });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.currentStock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock', 
        available: product.currentStock 
      });
    }
    
    // Prepare product for POS cart
    const posItem = {
      _id: product._id,
      barcode: product.barcode,
      name: product.name,
      price: product.sellingPrice,
      taxRate: product.taxRate,
      quantity: quantity,
      stock: product.currentStock,
      category: product.category
    };
    
    res.json(posItem);
  } catch (err) {
    console.error('Error processing barcode scan:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate barcode for new product
router.post('/generate', auth, async (req, res) => {
  try {
    // Custom nursery barcode format, e.g.: 299CCCPPPPS
    // where 299 is a standard prefix for internal use
    // CCC is category code
    // PPPP is product ID
    // S is a check digit
    
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    // Map category to code
    const categoryMap = {
      'Trees': '100',
      'Shrubs': '200',
      'Flowers': '300',
      'Herbs': '400',
      'Vegetables': '500',
      'Indoor Plants': '600',
      'Seeds': '700',
      'Tools': '800',
      'Fertilizers': '900',
      'Pots': '950'
    };
    
    const categoryCode = categoryMap[category] || '999';
    
    // Find last product in this category to generate a sequential number
    const lastProduct = await Product.findOne({ category })
      .sort({ barcode: -1 })
      .limit(1);
    
    let productNumber = '0001';
    
    if (lastProduct && lastProduct.barcode) {
      const lastProductNumber = lastProduct.barcode.substring(6, 10);
      const nextNumber = parseInt(lastProductNumber, 10) + 1;
      productNumber = nextNumber.toString().padStart(4, '0');
    }
    
    // Prefix + Category + Sequential Number without check digit yet
    let barcodeWithoutCheck = `299${categoryCode}${productNumber}`;
    
    // Calculate check digit (simple example, you might want to use a standard algorithm)
    let sum = 0;
    for (let i = 0; i < barcodeWithoutCheck.length; i++) {
      sum += parseInt(barcodeWithoutCheck[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Complete barcode
    const barcode = `${barcodeWithoutCheck}${checkDigit}`;
    
    res.json({ barcode });
  } catch (err) {
    console.error('Error generating barcode:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record inventory movement using barcode scan
router.post('/movement', auth, async (req, res) => {
  try {
    const { barcode, quantity, movementType, notes, location } = req.body;
    
    if (!barcode || !quantity || !movementType) {
      return res.status(400).json({ message: 'Barcode, quantity, and movement type are required' });
    }
    
    const product = await Product.findOne({ barcode });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const previousStock = product.currentStock;
    let newStock;
    
    // Update product stock based on movement type
    switch (movementType) {
      case 'Received':
      case 'Returned':
      case 'Adjustment':
        newStock = previousStock + quantity;
        break;
      case 'Sold':
      case 'Damaged':
        if (previousStock < quantity) {
          return res.status(400).json({ 
            message: 'Insufficient stock',
            available: previousStock
          });
        }
        newStock = previousStock - quantity;
        break;
      default:
        return res.status(400).json({ message: 'Invalid movement type' });
    }
    
    // Create inventory movement record
    const movement = new InventoryMovement({
      product: product._id,
      barcode,
      movementType,
      quantity,
      previousStock,
      newStock,
      notes,
      location,
      performedBy: req.user.id // From auth middleware
    });
    
    await movement.save();
    
    // Update product stock
    product.currentStock = newStock;
    await product.save();
    
    res.json({
      message: 'Inventory updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        previousStock,
        newStock
      },
      movement
    });
  } catch (err) {
    console.error('Error recording inventory movement:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;