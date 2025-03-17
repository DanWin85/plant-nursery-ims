// services/eftposService.js

/**
 * EFTPOS Integration Service
 * 
 * This service handles integration with EFTPOS payment terminals.
 * The implementation is based on a generic interface that can be adapted
 * to specific EFTPOS providers like Windcave, Verifone, or Smartpay.
 */

const axios = require('axios');
const config = require('../config');

class EftposService {
  constructor() {
    this.provider = config.eftpos.provider; // e.g., 'windcave', 'verifone', 'smartpay'
    this.terminal = config.eftpos.terminalId;
    this.merchantId = config.eftpos.merchantId;
    this.apiKey = config.eftpos.apiKey;
    this.baseUrl = config.eftpos.apiUrl;
    this.timeout = config.eftpos.timeout || 60000; // 1 minute default
  }

  /**
   * Process payment through the EFTPOS terminal
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Payment amount in dollars
   * @param {string} paymentData.reference - Transaction reference (e.g., sale number)
   * @returns {Promise<Object>} - Transaction result
   */
  async processPayment(paymentData) {
    try {
      const paymentRequest = this._buildPaymentRequest(paymentData);
      
      console.log(`Initiating EFTPOS payment of $${paymentData.amount.toFixed(2)}`);
      
      // For Windcave/PaymentExpress integration
      if (this.provider === 'windcave') {
        return await this._processWindcavePayment(paymentRequest);
      }
      
      // For Verifone integration
      if (this.provider === 'verifone') {
        return await this._processVerifonePayment(paymentRequest);
      }
      
      // For Smartpay integration
      if (this.provider === 'smartpay') {
        return await this._processSmartpayPayment(paymentRequest);
      }
      
      throw new Error(`Unsupported EFTPOS provider: ${this.provider}`);
    } catch (error) {
      console.error('EFTPOS payment error:', error);
      throw new Error(`EFTPOS payment failed: ${error.message}`);
    }
  }
  
  /**
   * Build the payment request based on provider requirements
   * @private
   */
  _buildPaymentRequest(paymentData) {
    const { amount, reference } = paymentData;
    
    // Convert amount to cents/smallest currency unit as required by most APIs
    const amountInCents = Math.round(amount * 100);
    
    switch (this.provider) {
      case 'windcave':
        return {
          TxnType: 'Purchase',
          AmountInput: amountInCents,
          CurrencyInput: 'NZD',
          MerchantReference: reference,
          TxnRef: `TXN-${Date.now()}`,
          PosTxnRef: reference
        };
        
      case 'verifone':
        return {
          transaction_type: 'PURCHASE',
          amount: amountInCents,
          currency: 'NZD',
          merchant_reference: reference,
          terminal_id: this.terminal
        };
        
      case 'smartpay':
        return {
          amount: {
            value: amountInCents,
            currency: 'NZD'
          },
          reference: reference,
          terminalId: this.terminal,
          merchantId: this.merchantId
        };
        
      default:
        return {
          amount: amountInCents,
          reference: reference,
          terminal: this.terminal
        };
    }
  }
  
  /**
   * Process payment through Windcave/PaymentExpress
   * @private
   */
  async _processWindcavePayment(paymentRequest) {
    const response = await axios.post(
      `${this.baseUrl}/transaction`,
      paymentRequest,
      {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      }
    );
    
    const result = response.data;
    
    if (result.Success) {
      return {
        success: true,
        transactionId: result.DpsTxnRef,
        authCode: result.AuthCode,
        cardType: result.CardName,
        lastFourDigits: result.CardNumber?.slice(-4) || '',
        responseText: result.ResponseText,
        amount: paymentRequest.AmountInput / 100,
        reference: paymentRequest.MerchantReference
      };
    } else {
      throw new Error(result.ResponseText || 'Payment declined');
    }
  }
  
  /**
   * Process payment through Verifone
   * @private
   */
  async _processVerifonePayment(paymentRequest) {
    // Implementation for Verifone
    const response = await axios.post(
      `${this.baseUrl}/api/pos/transaction`,
      paymentRequest,
      {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      }
    );
    
    const result = response.data;
    
    if (result.status === 'APPROVED') {
      return {
        success: true,
        transactionId: result.transaction_id,
        authCode: result.auth_code,
        cardType: result.card_type,
        lastFourDigits: result.masked_pan?.slice(-4) || '',
        responseText: result.response_text,
        amount: paymentRequest.amount / 100,
        reference: paymentRequest.merchant_reference
      };
    } else {
      throw new Error(result.response_text || 'Payment declined');
    }
  }
  
  /**
   * Process payment through Smartpay
   * @private
   */
  async _processSmartpayPayment(paymentRequest) {
    // Implementation for Smartpay
    const response = await axios.post(
      `${this.baseUrl}/v1/transactions`,
      paymentRequest,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      }
    );
    
    const result = response.data;
    
    if (result.status === 'COMPLETED') {
      return {
        success: true,
        transactionId: result.transactionId,
        authCode: result.approvalCode,
        cardType: result.paymentMethod.card.scheme,
        lastFourDigits: result.paymentMethod.card.number?.slice(-4) || '',
        responseText: result.statusReason,
        amount: paymentRequest.amount.value / 100,
        reference: paymentRequest.reference
      };
    } else {
      throw new Error(result.statusReason || 'Payment declined');
    }
  }
  
  /**
   * Void/cancel the last transaction
   */
  async voidTransaction(transactionId) {
    try {
      console.log(`Voiding transaction: ${transactionId}`);
      
      // Implementation depends on the EFTPOS provider
      switch (this.provider) {
        case 'windcave':
          return await this._voidWindcaveTransaction(transactionId);
        case 'verifone':
          return await this._voidVerifoneTransaction(transactionId);
        case 'smartpay':
          return await this._voidSmartpayTransaction(transactionId);
        default:
          throw new Error(`Unsupported EFTPOS provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('EFTPOS void error:', error);
      throw new Error(`Failed to void transaction: ${error.message}`);
    }
  }
  
  /**
   * Refund a transaction
   */
  async refundTransaction(transactionId, amount, reference) {
    try {
      const amountInCents = Math.round(amount * 100);
      console.log(`Refunding $${amount.toFixed(2)} from transaction: ${transactionId}`);
      
      // Implementation depends on the EFTPOS provider
      switch (this.provider) {
        case 'windcave':
          return await this._refundWindcaveTransaction(transactionId, amountInCents, reference);
        case 'verifone':
          return await this._refundVerifoneTransaction(transactionId, amountInCents, reference);
        case 'smartpay':
          return await this._refundSmartpayTransaction(transactionId, amountInCents, reference);
        default:
          throw new Error(`Unsupported EFTPOS provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('EFTPOS refund error:', error);
      throw new Error(`Failed to refund transaction: ${error.message}`);
    }
  }
  
  // Implementation details for each provider's void/refund methods would go here
  // For brevity, these methods are not fully implemented in this example
}

module.exports = new EftposService();