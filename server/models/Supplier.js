// models/Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'New Zealand'
    }
  },
  taxId: {
    type: String
  },
  website: {
    type: String
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productsSupplied: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  leadTime: {
    type: Number, // Average lead time in days
    default: 7
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
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

// Update the updatedAt field on save
supplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);