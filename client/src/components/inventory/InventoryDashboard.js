// client/src/components/inventory/InventoryDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Tabs, Tab, Badge, Alert, Spinner } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { BarcodeScanner } from '../pos/BarcodeScanner';
import { ProductModal } from './ProductModal';
import { InventoryMovementModal } from './InventoryMovementModal';
import { StockCountModal } from './StockCountModal';

const InventoryDashboard = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  
  // Load data on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStockProducts();
    fetchRecentMovements();
    fetchTopSellingProducts();
  }, []);
  
  // Filter products when search or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);
  
  // API calls
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/products/categories');
      setCategories(res.data);
    } catch (err) {
      setError('Failed to load categories');
    }
  };
  
  const fetchLowStockProducts = async () => {
    try {
      const res = await axios.get('/api/reports/inventory/low-stock');
      setLowStockProducts(res.data.products);
    } catch (err) {
      setError('Failed to load low stock products');
    }
  };
  
  const fetchRecentMovements = async () => {
    try {
      // Get movements for the last 7 days
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const res = await axios.get('/api/reports/inventory/movements', {
        params: {
          startDate: startDate.toISOString(),
          endDate
        }
      });
      
      setInventoryMovements(res.data.movements);
    } catch (err) {
      setError('Failed to load inventory movements');
    }
  };
  
  const fetchTopSellingProducts = async () => {
    try {
      const res = await axios.get('/api/reports/sales/month');
      
      // Extract top products from sales report
      if (res.data.topProducts) {
        setTopSellingProducts(res.data.topProducts.slice(0, 10));
      }
    } catch (err) {
      setError('Failed to load top selling products');
    }
  };
  
  // Filter products based on search and category
  const filterProducts = () => {
    let result = [...products];
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(term) ||
          product.barcode.includes(term) ||
          (product.plantDetails && product.plantDetails.scientificName?.toLowerCase().includes(term))
      );
    }
    
    setFilteredProducts(result);
  };
  
  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    if (!barcode) return;
    
    try {
      const res = await axios.get(`/api/barcode/${barcode}`);
      const product = res.data;
      
      if (product) {
        setSelectedProduct(product);
        setModalMode('view');
        setShowProductModal(true);
      }
    } catch (err) {
      setError(`Product with barcode ${barcode} not found`);
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setModalMode('view');
    setShowProductModal(true);
  };
  
  // Handle add product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalMode('add');
    setShowProductModal(true);
  };
  
  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setShowProductModal(true);
  };
  
  // Handle product save
  const handleSaveProduct = async (productData) => {
    try {
      let res;
      
      if (modalMode === 'add') {
        res = await axios.post('/api/products', productData);
      } else {
        res = await axios.put(`/api/products/${productData._id}`, productData);
      }
      
      // Refresh product list
      fetchProducts();
      
      // Close modal
      setShowProductModal(false);
      
      return { success: true, product: res.data };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Error saving product' 
      };
    }
  };
  
  // Handle inventory movement
  const handleInventoryMovement = (product = null) => {
    setSelectedProduct(product);
    setShowMovementModal(true);
  };
  
  // Handle stock count
  const handleStockCount = () => {
    setShowStockCountModal(true);
  };
  
  // Handle movement save
  const handleSaveMovement = async (movementData) => {
    try {
      const res = await axios.post('/api/barcode/movement', movementData);
      
      // Refresh data
      fetchProducts();
      fetchRecentMovements();
      
      // Close modal
      setShowMovementModal(false);
      
      return { success: true, movement: res.data.movement };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Error saving movement' 
      };
    }
  };
  
  // Render stock status badge
  const renderStockBadge = (currentStock, minimumStock) => {
    if (currentStock <= 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (currentStock <= minimumStock) {
      return <Badge bg="warning">Low Stock</Badge>;
    } else {
      return <Badge bg="success">In Stock</Badge>;
    }
  };
  
  return (
    <Container fluid className="inventory-dashboard">
      <Row className="mb-3">
        <Col>
          <h2>Inventory Management</h2>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleAddProduct}
            className="me-2"
          >
            Add Product
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleInventoryMovement()}
            className="me-2"
          >
            Record Movement
          </Button>
          <Button 
            variant="info" 
            onClick={handleStockCount}
          >
            Stock Count
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-2">
          <Col>
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>
              <h4>Barcode Scanner</h4>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Scan barcode or enter product code"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScan(e.target.value);
                      e.target.value = ''; // Clear after scan
                    }
                  }}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>
              <h4>Low Stock Alert</h4>
            </Card.Header>
            <Card.Body>
              {lowStockProducts.length === 0 ? (
                <p>No low stock items</p>
              ) : (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Minimum</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 5).map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>
                          {renderStockBadge(product.currentStock, product.minimumStock)}{' '}
                          {product.currentStock}
                        </td>
                        <td>{product.minimumStock}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleInventoryMovement({
                              _id: product.id,
                              barcode: product.barcode,
                              name: product.name,
                              currentStock: product.currentStock
                            })}
                          >
                            Restock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {lowStockProducts.length > 5 && (
                <div className="text-end">
                  <Button variant="link">View All ({lowStockProducts.length})</Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col>
          <Card>
            <Card.Header>
              <Row>
                <Col>
                  <h4>Inventory Management</h4>
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="products" className="mb-3">
                <Tab eventKey="products" title="Products">
                  {loading ? (
                    <div className="text-center p-5">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    </div>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Barcode</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Current Stock</th>
                          <th>Min. Stock</th>
                          <th>Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => (
                          <tr key={product._id}>
                            <td>{product.barcode}</td>
                            <td>
                              <a href="#" onClick={() => handleProductSelect(product)}>
                                {product.name}
                              </a>
                            </td>
                            <td>{product.category}</td>
                            <td>
                              {renderStockBadge(product.currentStock, product.minimumStock)}{' '}
                              {product.currentStock}
                            </td>
                            <td>{product.minimumStock}</td>
                            <td>${product.sellingPrice.toFixed(2)}</td>
                            <td>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                className="me-1"
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleInventoryMovement(product)}
                              >
                                Stock
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
                <Tab eventKey="movements" title="Recent Movements">
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Previous</th>
                        <th>New</th>
                        <th>Reference</th>
                        <th>By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMovements.map(movement => (
                        <tr key={movement.id}>
                          <td>{new Date(movement.timestamp).toLocaleString()}</td>
                          <td>{movement.product?.name || 'Unknown'}</td>
                          <td>
                            <Badge 
                              bg={
                                movement.movementType === 'Received' ? 'success' :
                                movement.movementType === 'Sold' ? 'primary' :
                                movement.movementType === 'Damaged' ? 'danger' :
                                movement.movementType === 'Returned' ? 'info' :
                                'secondary'
                              }
                            >
                              {movement.movementType}
                            </Badge>
                          </td>
                          <td>{movement.quantity}</td>
                          <td>{movement.previousStock}</td>
                          <td>{movement.newStock}</td>
                          <td>{movement.reference || '-'}</td>
                          <td>{movement.performedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>
                <Tab eventKey="analytics" title="Inventory Analytics">
                  <Row>
                    <Col md={6}>
                      <h5>Top Selling Products</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topSellingProducts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantity" fill="#8884d8" name="Units Sold" />
                          <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Col>
                    <Col md={6}>
                      <h5>Stock Levels by Category</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={categories.map(category => {
                            const productsInCategory = products.filter(p => p.category === category);
                            const totalStock = productsInCategory.reduce((sum, p) => sum + p.currentStock, 0);
                            const averageStock = productsInCategory.length > 0 ? 
                              totalStock / productsInCategory.length : 0;
                            
                            return {
                              name: category,
                              totalStock,
                              averageStock,
                              productCount: productsInCategory.length
                            };
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalStock" fill="#8884d8" name="Total Stock" />
                          <Bar dataKey="productCount" fill="#82ca9d" name="Product Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Product Modal */}
      <ProductModal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        product={selectedProduct}
        mode={modalMode}
        categories={categories}
        onSave={handleSaveProduct}
      />
      
      {/* Inventory Movement Modal */}
      <InventoryMovementModal
        show={showMovementModal}
        onHide={() => setShowMovementModal(false)}
        product={selectedProduct}
        onSave={handleSaveMovement}
      />
      
      {/* Stock Count Modal */}
      <StockCountModal
        show={showStockCountModal}
        onHide={() => setShowStockCountModal(false)}
        products={products}
        categories={categories}
        onComplete={(updatedCounts) => {
          setShowStockCountModal(false);
          fetchProducts();
        }}
      />
    </Container>
  );
};

export default InventoryDashboard;