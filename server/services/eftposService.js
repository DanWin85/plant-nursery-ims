// services/eftposService.js

/**
 * EFTPOS Integration Service (Mock implementation)
 * 
 * This is a simplified mock implementation that doesn't require the config module
 * It will simulate successful payment operations without external dependencies
 */

class EftposService {
  constructor() {
    this.provider = 'mock';
    this.terminal = 'TERMINAL01';
    this.merchantId = 'MERCHANT01';
  }

  /**
   * Process payment through the EFTPOS terminal (mock implementation)
   */
  async processPayment(paymentData) {
    try {
      console.log(`[MOCK] Processing EFTPOS payment of $${paymentData.amount.toFixed(2)}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Always return successful result for mock implementation
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        authCode: 'AUTH123',
        cardType: 'VISA',
        lastFourDigits: '4242',
        responseText: 'Payment approved',
        amount: paymentData.amount,
        reference: paymentData.reference
      };
    } catch (error) {
      console.error('EFTPOS payment error:', error);
      throw new Error(`EFTPOS payment failed: ${error.message}`);
    }
  }
  
  /**
   * Void/cancel the last transaction (mock implementation)
   */
  async voidTransaction(transactionId) {
    console.log(`[MOCK] Voiding transaction: ${transactionId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      responseText: 'Transaction voided successfully'
    };
  }
  
  /**
   * Refund a transaction (mock implementation)
   */
  async refundTransaction(transactionId, amount, reference) {
    console.log(`[MOCK] Refunding $${amount.toFixed(2)} from transaction: ${transactionId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      transactionId: `REFUND-${Date.now()}`,
      responseText: 'Refund processed successfully',
      amount: amount
    };
  }
}

module.exports = new EftposService();