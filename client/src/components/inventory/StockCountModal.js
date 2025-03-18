// src/components/inventory/StockCountModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, InputGroup, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';

export const StockCountModal = ({ 
  show, 
  onHide, 
  products,
  categories,
  onComplete
}) => {
  const [stockCounts, setStockCounts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scan');
  
  // Initialize stock counts from products
  useEffect(() => {
    if (products?.length > 0) {
      const counts = products.map(product => ({
        productId: product._id,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        currentCount: product.currentStock,
        newCount: product.currentStock,
        difference: 0,
        counted: false
      }));
      
      setStockCounts(counts);
      filterProducts(counts, selectedCategory, searchTerm);
    }
  }, [products]);
  
  // Filter products when search or category changes
  const filterProducts = (counts = stockCounts, category = selectedCategory, search = searchTerm) => {
    let filtered = [...counts];
    
    // Apply category filter
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Apply search filter
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.barcode.includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  };
  
  // Handle category change
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    filterProducts(stockCounts, category, searchTerm);
  };
  
  // Handle search term change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterProducts(stockCounts, selectedCategory, term);
  };
  
  // Handle barcode scan
  const handleBarcodeScan = async () => {
    if (!barcode.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Find product by barcode in stock counts
      const productIndex = stockCounts.findIndex(p => p.barcode === barcode);
      
      if (productIndex === -1) {
        setError(`Product with barcode ${barcode} not found`);
        setIsLoading(false);
        return;
      }
      
      // Update the count for this product
      const updatedCounts = [...stockCounts];
      // Increment the count by 1
      const currentValue = updatedCounts[productIndex].newCount;
      updatedCounts[productIndex].newCount = parseInt(currentValue) + 1;
      updatedCounts[productIndex].difference = 
        updatedCounts[productIndex].newCount - updatedCounts[productIndex].currentCount;
      updatedCounts[productIndex].counted = true;
      
      setStockCounts(updatedCounts);
      filterProducts(updatedCounts, selectedCategory, searchTerm);
      
      // Clear the barcode field
      setBarcode('');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle direct count update
  const handleCountChange = (productId, value) => {
    const updatedCounts = stockCounts.map(product => {
      if (product.productId === productId) {
        const newCount = parseInt(value) || 0;
        return {
          ...product,
          newCount,
          difference: newCount - product.currentCount,
          counted: true
        };
      }
      return product;
    });
    
    setStockCounts(updatedCounts);
    filterProducts(updatedCounts, selectedCategory, searchTerm);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Get only products that have been counted
    const countedProducts = stockCounts.filter(p => p.counted);
    
    if (countedProducts.length === 0) {
      setError('No products have been counted');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Update each product stock
      for (const product of countedProducts) {
        if (product.difference !== 0) {
          await axios.post('/api/barcode/movement', {
            barcode: product.barcode,
            quantity: Math.abs(product.difference),
            movementType: product.difference > 0 ? 'Received' : 'Adjustment',
            notes: 'Stock count adjustment',
            reference: `STOCK-COUNT-${new Date().toISOString().split('T')[0]}`
          });
        }
      }
      
      // Call onComplete with updated counts
      onComplete(countedProducts);
    } catch (err) {
      setError(err.message || 'Failed to update stock counts');
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      backdrop="static"
      keyboard={!isLoading && !isSubmitting}
      fullscreen="lg-down"
    >
      <Modal.Header closeButton>
        <Modal.Title>Stock Count</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <Tabs 
          activeKey={activeTab} 
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="scan" title="Barcode Scan">
            <Form.Group className="mb-3">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Scan barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                />
                <Button 
                  variant="primary" 
                  onClick={handleBarcodeScan}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    'Scan'
                  )}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Scan a barcode to add 1 to the count
              </Form.Text>
            </Form.Group>
          </Tab>
          
          <Tab eventKey="manual" title="Manual Count">
            <Form.Group className="mb-3">
              <div className="d-flex gap-2">
                <Form.Select 
                  value={selectedCategory} 
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
                
                <Form.Control
                  type="text"
                  placeholder="Search products"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </Form.Group>
          </Tab>
        </Tabs>
        
        <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Table striped bordered hover>
            <thead className="sticky-top bg-light">
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Current Stock</th>
                <th>New Count</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.productId} className={product.counted ? 'table-primary' : ''}>
                    <td>{product.name}</td>
                    <td>{product.barcode}</td>
                    <td>{product.currentCount}</td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        value={product.newCount}
                        onChange={(e) => handleCountChange(product.productId, e.target.value)}
                        size="sm"
                      />
                    </td>
                    <td className={
                      product.difference > 0 ? 'text-success' : 
                      product.difference < 0 ? 'text-danger' : ''
                    }>
                      {product.difference > 0 ? '+' : ''}{product.difference}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        
        <div className="mt-3">
          <Alert variant="info">
            <div className="d-flex justify-content-between">
              <span>
                <strong>Total Items Counted:</strong> {stockCounts.filter(p => p.counted).length}
              </span>
              <span>
                <strong>Total Differences:</strong> {stockCounts.reduce((sum, p) => sum + Math.abs(p.difference), 0)}
              </span>
            </div>
          </Alert>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting || stockCounts.filter(p => p.counted).length === 0}
        >
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            'Update Stock Counts'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockCountModal;