// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
  notes: {
    type: String
  },
  membershipLevel: {
    type: String,
    enum: ['Regular', 'Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Regular'
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  purchaseHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }],
  totalSpent: {
    type: Number,
    default: 0
  },
  isCommercial: {
    type: Boolean,
    default: false
  },
  commercialDetails: {
    companyName: String,
    taxId: String,
    accountNumber: String,
    discount: {
      type: Number,
      default: 0
    }
  },
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

// Update the updatedAt field on save
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to update customer loyalty points and total spent
customerSchema.methods.updatePurchaseStats = function(sale) {
  // Update total spent
  this.totalSpent += sale.total;
  
  // Add sale to purchase history if not already there
  if (!this.purchaseHistory.includes(sale._id)) {
    this.purchaseHistory.push(sale._id);
  }
  
  // Update loyalty points (1 point per dollar spent, simplified)
  const pointsEarned = Math.floor(sale.total);
  this.loyaltyPoints += pointsEarned;
  
  // Update membership level based on total spent
  if (this.totalSpent >= 5000) {
    this.membershipLevel = 'Platinum';
  } else if (this.totalSpent >= 2500) {
    this.membershipLevel = 'Gold';
  } else if (this.totalSpent >= 1000) {
    this.membershipLevel = 'Silver';
  } else if (this.totalSpent >= 500) {
    this.membershipLevel = 'Bronze';
  }
  
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);