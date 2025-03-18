import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';

const ProductsPage = () => {
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  
  const { setAlert } = alertContext;
  const { user } = authContext;
  
  // State
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    showInactive: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  // Role-based permissions
  const canEdit = user && ['admin', 'manager', 'inventory'].includes(user.role);
  const canDelete = user && ['admin'].includes(user.role);
  
  // Load products and categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [currentPage, filters]);
  
  // Fetch product categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setAlert('Failed to load categories', 'danger');
    }
  };
  
  // Fetch products with pagination and filters
  const fetchProducts = async () => {
    setLoading(true);
    
    try {
      // Build query parameters
      const params = {
        page: currentPage,
        limit: 15,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      
      // Add filters if they exist
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.showInactive !== undefined) params.active = !filters.showInactive;
      
      const res = await axios.get('/api/products', { params });
      
      setProducts(res.data.products);
      setFilteredProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setAlert('Failed to load products', 'danger');
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  // Handle pagination change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Render stock badges
  const renderStockBadge = (currentStock, minimumStock) => {
    if (currentStock <= 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    } else if (currentStock <= minimumStock) {
      return <span className="badge bg-warning">Low Stock</span>;
    } else {
      return <span className="badge bg-success">In Stock</span>;
    }
  };
  
  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await axios.delete(`/api/products/${id}`);
        setAlert(`Product "${name}" deleted successfully`, 'success');
        fetchProducts();
      } catch (err) {
        setAlert(err.response?.data?.message || 'Failed to delete product', 'danger');
      }
    }
  };
  
  if (loading && products.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="products-page">
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Products</h1>
          
          {canEdit && (
            <Link to="/products/add" className="btn btn-primary">
              <i className="fas fa-plus"></i> Add Product
            </Link>
          )}
        </div>
        
        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search products..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="form-group">
                  <select
                    className="form-select"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="form-group">
                  <select
                    className="form-select"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="currentStock">Stock</option>
                    <option value="sellingPrice">Price</option>
                  </select>
                </div>
              </div>
              
              <div className="col-md-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="showInactive"
                    checked={filters.showInactive}
                    onChange={handleFilterChange}
                    id="showInactive"
                  />
                  <label className="form-check-label" htmlFor="showInactive">
                    Show Inactive
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Products Table */}
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr key={product._id}>
                        <td>
                          <Link to={`/products/${product._id}`}>
                            {product.name}
                          </Link>
                        </td>
                        <td>{product.barcode}</td>
                        <td>{product.category}</td>
                        <td>{formatCurrency(product.sellingPrice)}</td>
                        <td>
                          {renderStockBadge(product.currentStock, product.minimumStock)}{' '}
                          {product.currentStock}
                        </td>
                        <td>
                          {product.isActive ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link 
                              to={`/products/${product._id}`} 
                              className="btn btn-outline-info"
                              title="View"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            
                            {canEdit && (
                              <Link 
                                to={`/products/edit/${product._id}`} 
                                className="btn btn-outline-primary"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                            )}
                            
                            {canDelete && (
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteProduct(product._id, product.name)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer">
              <nav>
                <ul className="pagination justify-content-center mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <li 
                      key={index} 
                      className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;