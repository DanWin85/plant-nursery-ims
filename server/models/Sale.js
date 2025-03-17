// models/Sale.js
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  barcode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['Cash', 'EFTPOS', 'Credit Card', 'Debit Card', 'Gift Card', 'Store Credit', 'Other']
  },
  amount: {
    type: Number,
    required: true
  },
  reference: {
    type: String
  },
  // For EFTPOS integration
  transactionId: {
    type: String
  },
  cardType: {
    type: String
  },
  lastFourDigits: {
    type: String
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [saleItemSchema],
  payments: [paymentSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxTotal: {
    type: Number,
    required: true
  },
  discountTotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  amountTendered: {
    type: Number
  },
  changeDue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Partially Refunded', 'Voided'],
    default: 'Completed'
  },
  notes: {
    type: String
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registerNumber: {
    type: String,
    required: true
  },
  receiptPrinted: {
    type: Boolean,
    default: false
  },
  receiptEmail: {
    type: String
  },
  receiptEmailSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Methods for calculating totals
saleSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;
  
  this.items.forEach(item => {
    subtotal += item.subtotal;
    taxTotal += item.taxAmount;
    discountTotal += (item.discountAmount * item.quantity);
  });
  
  this.subtotal = subtotal;
  this.taxTotal = taxTotal;
  this.discountTotal = discountTotal;
  this.total = subtotal + taxTotal - discountTotal;
  
  return this.total;
};

// Indexes for reporting
saleSchema.index({ createdAt: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ cashier: 1 });
saleSchema.index({ 'items.product': 1 });

// Generate sequential sale number
saleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    try {
      // Get the current date
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const prefix = `S${year}${month}${day}`;
      
      // Find the highest existing sale number with today's prefix
      const lastSale = await this.constructor.findOne({
        saleNumber: new RegExp(`^${prefix}`)
      }).sort({ saleNumber: -1 });
      
      let sequence = 1;
      
      if (lastSale && lastSale.saleNumber) {
        const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      // Format: S[YY][MM][DD][0001] e.g., S2303010001
      this.saleNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Sale', saleSchema);