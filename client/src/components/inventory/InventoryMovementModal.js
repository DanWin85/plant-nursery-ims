// src/components/inventory/InventoryMovementModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

export const InventoryMovementModal = ({ 
  show, 
  onHide, 
  product, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    barcode: '',
    quantity: 1,
    movementType: 'Received',
    notes: '',
    reference: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update form when product changes
  useEffect(() => {
    if (product) {
      setSelectedProduct(product);
      setFormData(prevState => ({
        ...prevState,
        barcode: product.barcode
      }));
      setIsManualEntry(false);
    } else {
      setSelectedProduct(null);
      setFormData({
        barcode: '',
        quantity: 1,
        movementType: 'Received',
        notes: '',
        reference: ''
      });
      setIsManualEntry(true);
    }
  }, [product]);
  
  // Handle form input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.barcode) {
      setError('Barcode is required');
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    // Validate for outgoing movements
    if (['Sold', 'Damaged'].includes(formData.movementType) && 
        selectedProduct && 
        selectedProduct.currentStock < formData.quantity) {
      setError(`Insufficient stock. Current stock: ${selectedProduct.currentStock}`);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call onSave function
      const result = await onSave(formData);
      
      if (result.success) {
        onHide();
      } else {
        setError(result.error || 'Failed to save inventory movement');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      backdrop="static"
      keyboard={!isLoading}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Record Inventory Movement</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          
          {selectedProduct && (
            <Alert variant="info" className="mb-3">
              <strong>{selectedProduct.name}</strong><br />
              Current Stock: {selectedProduct.currentStock}
            </Alert>
          )}
          
          <Form.Group className="mb-3" controlId="barcode">
            <Form.Label>Barcode</Form.Label>
            <Form.Control
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              disabled={!isManualEntry}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="movementType">
            <Form.Label>Movement Type</Form.Label>
            <Form.Select
              name="movementType"
              value={formData.movementType}
              onChange={handleChange}
              required
            >
              <option value="Received">Received</option>
              <option value="Sold">Sold</option>
              <option value="Damaged">Damaged/Discarded</option>
              <option value="Returned">Returned</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Transferred">Transferred</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="quantity">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              min="1"
              step="1"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="reference">
            <Form.Label>Reference (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Purchase order #, Invoice #, etc."
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="notes">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information..."
            />
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            Cancel
          </Button>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Save Movement'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InventoryMovementModal;