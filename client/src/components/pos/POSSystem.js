// client/src/components/pos/POSSystem.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, ListGroup, Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { BarcodeScanner } from './BarcodeScanner';
import { CategorySelector } from './CategorySelector';
import { ProductGrid } from './ProductGrid';
import { CartItem } from './CartItem';
import { PaymentModal } from './PaymentModal';
import ReceiptPrinter from '../../utils/ReceiptPrinter';

const POSSystem = () => {
  // State management
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentSale, setCurrentSale] = useState(null);
  
  const barcodeScannerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Load products and categories on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  // Filter products when search or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);
  
  // Focus on barcode input when cart changes
  useEffect(() => {
    if (barcodeScannerRef.current) {
      barcodeScannerRef.current.focus();
    }
  }, [cart]);
  
  // API calls
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setIsLoading(false);
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
  
  // Handle scanning barcode
  const handleBarcodeSubmit = async (barcode) => {
    if (!barcode) return;
    
    try {
      const res = await axios.get(`/api/barcode/${barcode}`);
      const product = res.data;
      
      if (product) {
        addToCart(product);
      }
    } catch (err) {
      setError(`Product with barcode ${barcode} not found`);
      // Clear the error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
    
    // Clear the barcode input
    if (barcodeScannerRef.current) {
      barcodeScannerRef.current.value = '';
    }
  };
  
  // Add product to cart
  const addToCart = (product, quantity = 1) => {
    if (product.currentStock < quantity) {
      setError(`Only ${product.currentStock} units available`);
      return;
    }
    
    setCart(prevCart => {
      // Check if product already in cart
      const existingItemIndex = prevCart.findIndex(item => item._id === product._id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if product already in cart
        const updatedCart = [...prevCart];
        const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
        
        // Check stock for updated quantity
        if (product.currentStock < newQuantity) {
          setError(`Only ${product.currentStock} units available`);
          return prevCart;
        }
        
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: newQuantity,
          subtotal: parseFloat((product.sellingPrice * newQuantity).toFixed(2))
        };
        
        return updatedCart;
      } else {
        // Add new product to cart
        return [...prevCart, {
          _id: product._id,
          barcode: product.barcode,
          name: product.name,
          price: product.sellingPrice,
          taxRate: product.taxRate || 15, // Default GST rate
          quantity: quantity,
          subtotal: parseFloat((product.sellingPrice * quantity).toFixed(2)),
          stock: product.currentStock
        }];
      }
    });
    
    // Clear any previous errors
    setError('');
  };
  
  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };
  
  // Update item quantity in cart
  const updateCartItemQuantity = (productId, newQuantity) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === productId) {
          // Check if new quantity is valid
          if (newQuantity <= 0) {
            return item; // Ignore invalid quantities
          }
          
          // Check stock availability
          if (newQuantity > item.stock) {
            setError(`Only ${item.stock} units available`);
            return item;
          }
          
          return {
            ...item,
            quantity: newQuantity,
            subtotal: parseFloat((item.price * newQuantity).toFixed(2))
          };
        }
        return item;
      });
    });
  };
  
  // Calculate cart totals
  const calculateCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = cart.reduce((sum, item) => {
      const itemTax = (item.subtotal * (item.taxRate / 100));
      return sum + itemTax;
    }, 0);
    
    const total = subtotal + taxAmount;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };
  
  // Clear the cart
  const clearCart = () => {
    setCart([]);
    setCurrentSale(null);
  };
  
  // Process payment and create sale
  const processSale = async (paymentMethod, amountTendered) => {
    if (cart.length === 0) {
      setError('Cannot process empty cart');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const totals = calculateCartTotals();
      
      // Prepare sale data
      const saleData = {
        items: cart.map(item => ({
          product: item._id,
          barcode: item.barcode,
          name: item.name,
          quantity: item.quantity,
          pricePerUnit: item.price,
          taxRate: item.taxRate,
          taxAmount: parseFloat(((item.price * item.quantity) * (item.taxRate / 100)).toFixed(2)),
          subtotal: item.subtotal,
          total: parseFloat((item.subtotal + ((item.subtotal * item.taxRate) / 100)).toFixed(2))
        })),
        subtotal: totals.subtotal,
        taxTotal: totals.tax,
        total: totals.total,
        amountTendered: parseFloat(amountTendered) || totals.total,
        changeDue: parseFloat(amountTendered) > totals.total ? 
          parseFloat((parseFloat(amountTendered) - totals.total).toFixed(2)) : 0,
        payments: [
          {
            method: paymentMethod,
            amount: totals.total
          }
        ]
      };
      
      // Send sale to server
      const res = await axios.post('/api/sales', saleData);
      
      // Handle EFTPOS payments if necessary
      if (paymentMethod === 'EFTPOS' || paymentMethod === 'Credit Card') {
        // Process EFTPOS payment
        setPaymentStatus('processing');
        
        const paymentRes = await axios.post('/api/payments/eftpos', {
          amount: totals.total,
          saleReference: res.data.saleNumber
        });
        
        if (paymentRes.data.success) {
          setPaymentStatus('success');
        } else {
          setPaymentStatus('failed');
          throw new Error(paymentRes.data.message || 'Payment processing failed');
        }
      } else {
        setPaymentStatus('success');
      }
      
      // Set current sale for receipt
      setCurrentSale(res.data);
      
      // Update inventory for sold items
      for (const item of cart) {
        await axios.post('/api/barcode/movement', {
          barcode: item.barcode,
          quantity: item.quantity,
          movementType: 'Sold',
          reference: res.data.saleNumber
        });
      }
      
      // Clear the cart after successful sale
      setCart([]);
      setIsLoading(false);
      
      // Optional: Print receipt
      if (res.data && res.data.saleNumber) {
        ReceiptPrinter.printReceipt(res.data);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale');
      setPaymentStatus('failed');
      setIsLoading(false);
    }
  };
  
  // Handle payment modal
  const openPaymentModal = () => {
    if (cart.length === 0) {
      setError('Cannot checkout empty cart');
      return;
    }
    
    setPaymentStatus(null);
    setShowPaymentModal(true);
  };
  
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    
    // If payment was successful and we have a current sale
    if (paymentStatus === 'success' && currentSale) {
      // Optionally show receipt or confirmation
    }
  };
  
  // Cart totals
  const totals = calculateCartTotals();
  
  return (
    <Container fluid className="pos-container">
      <Row className="mb-3">
        <Col>
          <h2>Plant Nursery POS</h2>
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
      
      <Row>
        {/* Product Browser */}
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header>
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Control
                      ref={barcodeScannerRef}
                      type="text"
                      placeholder="Scan barcode or enter product code"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeSubmit(e.target.value);
                        }
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Button 
                    variant="primary" 
                    onClick={() => handleBarcodeSubmit(barcodeScannerRef.current.value)}
                  >
                    Add Item
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            
            <Card.Body>
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Control
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col md={4}>
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
              
              {isLoading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <ProductGrid 
                  products={filteredProducts}
                  onProductClick={addToCart}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Cart */}
        <Col md={4}>
          <Card className="cart-card">
            <Card.Header>
              <h3>Shopping Cart</h3>
            </Card.Header>
            <Card.Body className="p-0">
              {cart.length === 0 ? (
                <div className="text-center p-5">
                  <p>Cart is empty</p>
                  <p>Scan a barcode or select products to add</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {cart.map(item => (
                    <CartItem
                      key={item._id}
                      item={item}
                      onRemove={removeFromCart}
                      onUpdateQuantity={updateCartItemQuantity}
                    />
                  ))}
                </ListGroup>
              )}
            </Card.Body>
            <Card.Footer>
              <Row className="mb-2">
                <Col><strong>Subtotal:</strong></Col>
                <Col className="text-end">${totals.subtotal.toFixed(2)}</Col>
              </Row>
              <Row className="mb-2">
                <Col><strong>Tax:</strong></Col>
                <Col className="text-end">${totals.tax.toFixed(2)}</Col>
              </Row>
              <Row className="mb-3">
                <Col><strong>Total:</strong></Col>
                <Col className="text-end"><strong>${totals.total.toFixed(2)}</strong></Col>
              </Row>
              <Row>
                <Col>
                  <Button 
                    variant="danger" 
                    className="w-100 mb-2"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Clear Cart
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="success" 
                    className="w-100 mb-2"
                    onClick={openPaymentModal}
                    disabled={cart.length === 0}
                  >
                    Checkout
                  </Button>
                </Col>
              </Row>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onHide={closePaymentModal}
        onProcessPayment={processSale}
        total={totals.total}
        paymentStatus={paymentStatus}
        sale={currentSale}
      />
    </Container>
  );
};

export default POSSystem;