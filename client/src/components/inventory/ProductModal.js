// src/components/inventory/ProductModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';

export const ProductModal = ({ 
  show, 
  onHide, 
  product,
  categories,
  mode = 'view', // 'view', 'add', or 'edit'
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    subcategory: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '0',
    minimumStock: '5',
    location: '',
    isActive: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update form when product changes
  useEffect(() => {
    if (product && (mode === 'view' || mode === 'edit')) {
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        description: product.description || '',
        costPrice: product.costPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        currentStock: product.currentStock?.toString() || '0',
        minimumStock: product.minimumStock?.toString() || '5',
        location: product.location || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        barcode: '',
        category: categories?.length > 0 ? categories[0] : '',
        subcategory: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '0',
        minimumStock: '5',
        location: '',
        isActive: true
      });
    }
  }, [product, mode, categories]);
  
  // Handle form input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get profit margin
  const getProfitMargin = () => {
    const cost = parseFloat(formData.costPrice);
    const selling = parseFloat(formData.sellingPrice);
    
    if (isNaN(cost) || isNaN(selling) || cost <= 0 || selling <= 0) {
      return 0;
    }
    
    return Math.round(((selling - cost) / selling) * 100);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') {
      return onHide();
    }
    
    // Validate required fields
    if (!formData.name || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare data for API
      const productData = {
        ...formData,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        currentStock: parseInt(formData.currentStock) || 0,
        minimumStock: parseInt(formData.minimumStock) || 5
      };
      
      // Add _id for edit mode
      if (mode === 'edit' && product) {
        productData._id = product._id;
      }
      
      // Call onSave function
      const result = await onSave(productData);
      
      if (result.success) {
        onHide();
      } else {
        setError(result.error || 'Failed to save product');
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
      size="lg"
      backdrop="static"
      keyboard={!isLoading}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'add' ? 'Add New Product' : mode === 'edit' ? 'Edit Product' : 'Product Details'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>Product Name<span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group controlId="barcode">
                <Form.Label>Barcode<span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  disabled={mode === 'view' || mode === 'edit'}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="category">
                <Form.Label>Category<span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group controlId="subcategory">
                <Form.Label>Subcategory</Form.Label>
                <Form.Control
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={mode === 'view'}
            />
          </Form.Group>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="costPrice">
                <Form.Label>Cost Price<span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="sellingPrice">
                <Form.Label>Selling Price<span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label>Profit Margin</Form.Label>
                <div className="form-control bg-light">
                  {formData.costPrice && formData.sellingPrice ? (
                    <span className={getProfitMargin() < 20 ? 'text-danger' : 'text-success'}>
                      {getProfitMargin()}%
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="currentStock">
                <Form.Label>Current Stock</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  min="0"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  disabled={mode === 'view' || mode === 'edit'}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="minimumStock">
                <Form.Label>Minimum Stock</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  min="0"
                  name="minimumStock"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group controlId="location">
                <Form.Label>Storage Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group controlId="isActive">
            <Form.Check
              type="switch"
              label="Active"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={mode === 'view'}
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
                Saving...
              </>
            ) : mode === 'view' ? (
              'Close'
            ) : mode === 'edit' ? (
              'Update Product'
            ) : (
              'Add Product'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductModal;