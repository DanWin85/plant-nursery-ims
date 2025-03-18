// src/components/pos/PaymentModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

export const PaymentModal = ({ 
  show, 
  onHide, 
  onProcessPayment, 
  total, 
  paymentStatus,
  sale 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [changeDue, setChangeDue] = useState(0);

  // Update amount tendered when total changes
  useEffect(() => {
    if (paymentMethod === 'Cash') {
      // Set initial amount to exact value
      setAmountTendered(total.toFixed(2));
      setChangeDue(0);
    } else {
      // For other payment methods, amount is always exact
      setAmountTendered(total.toFixed(2));
      setChangeDue(0);
    }
  }, [total, paymentMethod]);

  // Calculate change due
  useEffect(() => {
    if (paymentMethod === 'Cash' && amountTendered) {
      const tendered = parseFloat(amountTendered);
      if (!isNaN(tendered) && tendered >= total) {
        setChangeDue(tendered - total);
      } else {
        setChangeDue(0);
      }
    } else {
      setChangeDue(0);
    }
  }, [amountTendered, total, paymentMethod]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle amount tendered change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmountTendered(value);
  };

  // Handle payment processing
  const handlePayment = () => {
    const amount = parseFloat(amountTendered);
    if (paymentMethod === 'Cash' && (isNaN(amount) || amount < total)) {
      alert('Amount tendered must be at least the total amount');
      return;
    }
    onProcessPayment(paymentMethod, amount);
  };

  // Render content based on payment status
  const renderModalContent = () => {
    if (paymentStatus === 'processing') {
      return (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" variant="primary" />
          <h4 className="mt-3">Processing Payment...</h4>
          <p className="text-muted">Please wait while we process your payment</p>
        </div>
      );
    } else if (paymentStatus === 'success') {
      return (
        <div className="text-center p-4">
          <div className="bg-success text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
            <i className="fas fa-check fa-3x"></i>
          </div>
          <h4>Payment Successful!</h4>
          <p>Sale #{sale?.saleNumber} completed</p>
          <div className="mt-4">
            <Button variant="outline-primary" className="me-2">
              <i className="fas fa-print me-2"></i> Print Receipt
            </Button>
            <Button variant="outline-secondary" className="me-2">
              <i className="fas fa-envelope me-2"></i> Email Receipt
            </Button>
            <Button variant="primary" onClick={onHide}>
              <i className="fas fa-check me-2"></i> Done
            </Button>
          </div>
        </div>
      );
    } else if (paymentStatus === 'failed') {
      return (
        <div className="text-center p-4">
          <div className="bg-danger text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
            <i className="fas fa-times fa-3x"></i>
          </div>
          <h4>Payment Failed</h4>
          <p>The payment could not be processed. Please try again.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePayment}>
              Retry Payment
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <>
          <Modal.Header closeButton>
            <Modal.Title>Checkout - {formatCurrency(total)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="EFTPOS">EFTPOS/Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Gift Card">Gift Card</option>
                </Form.Select>
              </Form.Group>
              
              {paymentMethod === 'Cash' && (
                <Form.Group className="mb-3">
                  <Form.Label>Amount Tendered</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    min={total}
                    value={amountTendered} 
                    onChange={handleAmountChange}
                  />
                </Form.Group>
              )}
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Due:</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              
              {paymentMethod === 'Cash' && amountTendered && parseFloat(amountTendered) >= total && (
                <div className="d-flex justify-content-between align-items-center mb-3 text-success">
                  <span>Change Due:</span>
                  <strong>{formatCurrency(changeDue)}</strong>
                </div>
              )}
              
              {paymentMethod === 'EFTPOS' || paymentMethod === 'Credit Card' ? (
                <Alert variant="info">
                  <i className="fas fa-info-circle me-2"></i>
                  Please follow the instructions on the EFTPOS terminal to complete the payment.
                </Alert>
              ) : null}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePayment}>
              Process Payment
            </Button>
          </Modal.Footer>
        </>
      );
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={paymentStatus === 'success' || paymentStatus === 'failed' ? onHide : null}
      backdrop={paymentStatus === 'processing' ? 'static' : true}
      keyboard={paymentStatus !== 'processing'}
      centered
      size="lg"
    >
      {renderModalContent()}
    </Modal>
  );
};

export default PaymentModal;