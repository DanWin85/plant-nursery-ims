// models/InventoryMovement.js
const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  movementType: {
    type: String,
    required: true,
    enum: ['Received', 'Sold', 'Returned', 'Damaged', 'Adjustment', 'Transferred', 'StockCount']
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reference: {
    // Could be sale ID, purchase order ID, etc.
    type: String
  },
  notes: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookup by product and movement type
inventoryMovementSchema.index({ product: 1, movementType: 1 });
inventoryMovementSchema.index({ barcode: 1 });
inventoryMovementSchema.index({ timestamp: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);