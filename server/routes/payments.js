// routes/payments.js
const express = require('express');
const router = express.Router();
const eftposService = require('../services/eftposService');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');

// Process EFTPOS payment
router.post('/eftpos', auth, async (req, res) => {
  try {
    const { amount, saleReference } = req.body;
    
    if (!amount || !saleReference) {
      return res.status(400).json({ message: 'Amount and sale reference are required' });
    }
    
    // Find the sale
    const sale = await Sale.findOne({ saleNumber: saleReference });
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Process payment through EFTPOS terminal
    const paymentResult = await eftposService.processPayment({
      amount: amount,
      reference: saleReference
    });
    
    if (paymentResult.success) {
      // Add payment to sale
      sale.payments.push({
        method: 'EFTPOS',
        amount: paymentResult.amount,
        reference: saleReference,
        transactionId: paymentResult.transactionId,
        cardType: paymentResult.cardType,
        lastFourDigits: paymentResult.lastFourDigits
      });
      
      // Update sale status if fully paid
      const totalPayments = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPayments >= sale.total) {
        sale.status = 'Completed';
      }
      
      await sale.save();
      
      res.json({
        success: true,
        payment: paymentResult,
        sale: {
          id: sale._id,
          saleNumber: sale.saleNumber,
          total: sale.total,
          status: sale.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.responseText || 'Payment failed'
      });
    }
  } catch (err) {
    console.error('EFTPOS payment error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Payment processing error' 
    });
  }
});

// Void/Cancel a payment
router.post('/void', auth, async (req, res) => {
  try {
    const { transactionId, saleNumber } = req.body;
    
    if (!transactionId || !saleNumber) {
      return res.status(400).json({ 
        message: 'Transaction ID and sale number are required' 
      });
    }
    
    // Find the sale
    const sale = await Sale.findOne({ saleNumber });
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Check if the transaction exists in this sale
    const paymentIndex = sale.payments.findIndex(p => p.transactionId === transactionId);
    
    if (paymentIndex === -1) {
      return res.status(404).json({ 
        message: 'Transaction not found for this sale' 
      });
    }
    
    // Process void through EFTPOS terminal
    const voidResult = await eftposService.voidTransaction(transactionId);
    
    if (voidResult.success) {
      // Remove the payment from the sale
      const removedPayment = sale.payments.splice(paymentIndex, 1)[0];
      
      // Update sale status
      sale.status = 'Voided';
      await sale.save();
      
      res.json({
        success: true,
        message: 'Payment voided successfully',
        voidedAmount: removedPayment.amount,
        sale: {
          id: sale._id,
          saleNumber: sale.saleNumber,
          status: sale.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: voidResult.responseText || 'Failed to void payment'
      });
    }
  } catch (err) {
    console.error('Payment void error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Error voiding payment' 
    });
  }
});

// Process refund
router.post('/refund', auth, async (req, res) => {
  try {
    const { transactionId, amount, saleNumber } = req.body;
    
    if (!transactionId || !amount || !saleNumber) {
      return res.status(400).json({ 
        message: 'Transaction ID, amount, and sale number are required' 
      });
    }
    
    // Find the sale
    const sale = await Sale.findOne({ saleNumber });
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Check if the transaction exists in this sale
    const payment = sale.payments.find(p => p.transactionId === transactionId);
    
    if (!payment) {
      return res.status(404).json({ 
        message: 'Transaction not found for this sale' 
      });
    }
    
    // Check if refund amount is valid
    if (amount > payment.amount) {
      return res.status(400).json({ 
        message: 'Refund amount cannot exceed original payment amount' 
      });
    }
    
    // Process refund through EFTPOS terminal
    const refundResult = await eftposService.refundTransaction(
      transactionId,
      amount,
      `REFUND-${saleNumber}`
    );
    
    if (refundResult.success) {
      // Update sale status
      if (Math.abs(amount - payment.amount) < 0.01) {
        // Full refund
        sale.status = 'Refunded';
      } else {
        // Partial refund
        sale.status = 'Partially Refunded';
      }
      
      // Add refund record
      sale.refunds = sale.refunds || [];
      sale.refunds.push({
        originalTransactionId: transactionId,
        refundTransactionId: refundResult.transactionId,
        amount: amount,
        date: new Date(),
        processedBy: req.user.id
      });
      
      await sale.save();
      
      res.json({
        success: true,
        message: 'Payment refunded successfully',
        refundAmount: amount,
        sale: {
          id: sale._id,
          saleNumber: sale.saleNumber,
          status: sale.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: refundResult.responseText || 'Failed to process refund'
      });
    }
  } catch (err) {
    console.error('Payment refund error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Error processing refund' 
    });
  }
});

module.exports = router;