// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Trees', 'Shrubs', 'Flowers', 'Herbs', 'Vegetables', 'Indoor Plants', 'Seeds', 'Tools', 'Fertilizers', 'Pots']
  },
  subcategory: {
    type: String
  },
  description: {
    type: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  costPrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 15 // Default NZ GST
  },
  currentStock: {
    type: Number,
    default: 0
  },
  minimumStock: {
    type: Number,
    default: 5
  },
  location: {
    type: String
  },
  plantDetails: {
    scientificName: String,
    growthHabit: String,
    careLevel: {
      type: String,
      enum: ['Easy', 'Moderate', 'Difficult']
    },
    sunRequirement: {
      type: String,
      enum: ['Full Sun', 'Partial Sun', 'Shade']
    },
    wateringNeeds: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    seasonality: [String],
    isPerennial: Boolean,
    matureHeight: Number,
    matureWidth: Number,
    bloomTime: String,
    hardinessZone: String
  },
  images: [{
    url: String,
    isPrimary: Boolean
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for improved query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'plantDetails.scientificName': 1 });

// Add method to check if reorder is needed
productSchema.methods.needsReorder = function() {
  return this.currentStock <= this.minimumStock;
};

// Middleware to update the updatedAt field on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);