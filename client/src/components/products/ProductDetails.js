import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  
  const { setAlert } = alertContext;
  const { user } = authContext;
  
  // Role-based permissions
  const canEdit = user && ['admin', 'manager', 'inventory'].includes(user.role);
  const canDelete = user && ['admin'].includes(user.role);
  
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        // Fetch product details
        const productRes = await axios.get(`/api/products/${id}`);
        setProduct(productRes.data);
        
        // Fetch supplier if available
        if (productRes.data.supplier) {
          const supplierRes = await axios.get(`/api/suppliers/${productRes.data.supplier}`);
          setSupplier(supplierRes.data);
        }
        
        // Fetch recent movements for this product
        const movementsRes = await axios.get(`/api/inventory/movements?product=${id}&limit=10`);
        setMovements(movementsRes.data.movements || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setAlert('Failed to load product details', 'danger');
        setLoading(false);
        
        // Redirect to products page if product not found
        if (err.response && err.response.status === 404) {
          navigate('/products');
        }
      }
    };
    
    fetchProductData();
  }, [id, navigate, setAlert]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle product deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        setAlert('Product deleted successfully', 'success');
        navigate('/products');
      } catch (err) {
        setAlert(err.response?.data?.message || 'Failed to delete product', 'danger');
      }
    }
  };
  
  // Render stock badge
  const renderStockBadge = (currentStock, minimumStock) => {
    if (currentStock <= 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    } else if (currentStock <= minimumStock) {
      return <span className="badge bg-warning">Low Stock</span>;
    } else {
      return <span className="badge bg-success">In Stock</span>;
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="alert alert-danger">
        Product not found
      </div>
    );
  }
  
  return (
    <div className="product-details">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>{product.name}</h1>
            <p className="text-muted mb-0">Barcode: {product.barcode}</p>
          </div>
          
          <div className="btn-group">
            <Link to="/products" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left"></i> Back to Products
            </Link>
            
            {canEdit && (
              <Link to={`/products/edit/${id}`} className="btn btn-primary">
                <i className="fas fa-edit"></i> Edit Product
              </Link>
            )}
            
            {canDelete && (
              <button onClick={handleDelete} className="btn btn-danger">
                <i className="fas fa-trash"></i> Delete
              </button>
            )}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="row">
          {/* Main Details */}
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Product Details</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Basic Information</h6>
                    <table className="table table-borderless table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">Category:</th>
                          <td>{product.category}</td>
                        </tr>
                        {product.subcategory && (
                          <tr>
                            <th>Subcategory:</th>
                            <td>{product.subcategory}</td>
                          </tr>
                        )}
                        <tr>
                          <th>Cost Price:</th>
                          <td>{formatCurrency(product.costPrice)}</td>
                        </tr>
                        <tr>
                          <th>Selling Price:</th>
                          <td>{formatCurrency(product.sellingPrice)}</td>
                        </tr>
                        <tr>
                          <th>Tax Rate:</th>
                          <td>{product.taxRate}%</td>
                        </tr>
                        <tr>
                          <th>Status:</th>
                          <td>
                            {product.isActive ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-secondary">Inactive</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="col-md-6">
                    <h6>Inventory Information</h6>
                    <table className="table table-borderless table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">Current Stock:</th>
                          <td>
                            {renderStockBadge(product.currentStock, product.minimumStock)}{' '}
                            {product.currentStock}
                          </td>
                        </tr>
                        <tr>
                          <th>Minimum Stock:</th>
                          <td>{product.minimumStock}</td>
                        </tr>
                        <tr>
                          <th>Location:</th>
                          <td>{product.location || 'Not specified'}</td>
                        </tr>
                        {supplier && (
                          <>
                            <tr>
                              <th>Supplier:</th>
                              <td>
                                <Link to={`/suppliers/${supplier._id}`}>
                                  {supplier.name}
                                </Link>
                              </td>
                            </tr>
                            <tr>
                              <th>Supplier Contact:</th>
                              <td>{supplier.contactPerson || 'N/A'}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <th>Created:</th>
                          <td>{formatDate(product.createdAt)}</td>
                        </tr>
                        <tr>
                          <th>Last Updated:</th>
                          <td>{formatDate(product.updatedAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {product.description && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <h6>Description</h6>
                      <p>{product.description}</p>
                    </div>
                  </div>
                )}
                
                {/* Plant details if available */}
                {product.plantDetails && Object.keys(product.plantDetails).length > 0 && (
                  <div className="row">
                    <div className="col-12">
                      <h6>Plant Details</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <table className="table table-borderless table-sm">
                            <tbody>
                              {product.plantDetails.scientificName && (
                                <tr>
                                  <th width="40%">Scientific Name:</th>
                                  <td><em>{product.plantDetails.scientificName}</em></td>
                                </tr>
                              )}
                              {product.plantDetails.growthHabit && (
                                <tr>
                                  <th>Growth Habit:</th>
                                  <td>{product.plantDetails.growthHabit}</td>
                                </tr>
                              )}
                              {product.plantDetails.careLevel && (
                                <tr>
                                  <th>Care Level:</th>
                                  <td>{product.plantDetails.careLevel}</td>
                                </tr>
                              )}
                              {product.plantDetails.sunRequirement && (
                                <tr>
                                  <th>Sun Requirement:</th>
                                  <td>{product.plantDetails.sunRequirement}</td>
                                </tr>
                              )}
                              {product.plantDetails.wateringNeeds && (
                                <tr>
                                  <th>Watering Needs:</th>
                                  <td>{product.plantDetails.wateringNeeds}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="col-md-6">
                          <table className="table table-borderless table-sm">
                            <tbody>
                              {product.plantDetails.seasonality && product.plantDetails.seasonality.length > 0 && (
                                <tr>
                                  <th width="40%">Seasonality:</th>
                                  <td>{product.plantDetails.seasonality.join(', ')}</td>
                                </tr>
                              )}
                              {product.plantDetails.isPerennial !== undefined && (
                                <tr>
                                  <th>Perennial:</th>
                                  <td>{product.plantDetails.isPerennial ? 'Yes' : 'No'}</td>
                                </tr>
                              )}
                              {product.plantDetails.matureHeight && (
                                <tr>
                                  <th>Mature Height:</th>
                                  <td>{product.plantDetails.matureHeight} cm</td>
                                </tr>
                              )}
                              {product.plantDetails.matureWidth && (
                                <tr>
                                  <th>Mature Width:</th>
                                  <td>{product.plantDetails.matureWidth} cm</td>
                                </tr>
                              )}
                              {product.plantDetails.bloomTime && (
                                <tr>
                                  <th>Bloom Time:</th>
                                  <td>{product.plantDetails.bloomTime}</td>
                                </tr>
                              )}
                              {product.plantDetails.hardinessZone && (
                                <tr>
                                  <th>Hardiness Zone:</th>
                                  <td>{product.plantDetails.hardinessZone}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Inventory Movements */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Inventory Movements</h5>
                {canEdit && (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/inventory?product=${id}`)}
                  >
                    Record Movement
                  </button>
                )}
              </div>
              <div className="card-body p-0">
                {movements.length === 0 ? (
                  <div className="p-4 text-center">
                    <p>No inventory movements recorded for this product.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Previous Stock</th>
                          <th>New Stock</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map(movement => (
                          <tr key={movement.id}>
                            <td>{new Date(movement.timestamp).toLocaleString()}</td>
                            <td>
                              <span className={`badge bg-${
                                movement.movementType === 'Received' ? 'success' :
                                movement.movementType === 'Sold' ? 'primary' :
                                movement.movementType === 'Damaged' ? 'danger' :
                                movement.movementType === 'Returned' ? 'info' :
                                'secondary'
                              }`}>
                                {movement.movementType}
                              </span>
                            </td>
                            <td>{movement.quantity}</td>
                            <td>{movement.previousStock}</td>
                            <td>{movement.newStock}</td>
                            <td>{movement.reference || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {movements.length > 0 && (
                <div className="card-footer text-end">
                  <Link to={`/inventory?product=${id}`} className="btn btn-sm btn-outline-primary">
                    View All Movements
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Product Images */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Product Image</h5>
              </div>
              <div className="card-body text-center">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name} 
                    className="img-fluid product-image"
                    style={{ maxHeight: '200px' }}
                  />
                ) : (
                  <div className="product-placeholder">
                    <i className="fas fa-seedling fa-5x text-muted"></i>
                    <p className="mt-3 text-muted">No product image available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  {canEdit && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => navigate(`/inventory?product=${id}&action=receive`)}
                      >
                        <i className="fas fa-plus-circle me-2"></i> Receive Stock
                      </button>
                      
                      <button 
                        className="btn btn-warning"
                        onClick={() => navigate(`/inventory?product=${id}&action=adjust`)}
                      >
                        <i className="fas fa-sync-alt me-2"></i> Adjust Stock
                      </button>
                    </>
                  )}
                  
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/pos?product=${id}`)}
                  >
                    <i className="fas fa-shopping-cart me-2"></i> Add to Sale
                  </button>
                  
                  {product.supplier && (
                    <Link 
                      to={`/suppliers/${product.supplier}`} 
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-truck me-2"></i> View Supplier
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Pricing Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Pricing</h5>
              </div>
              <div className="card-body">
                <div className="pricing-info">
                  <div className="mb-3">
                    <div className="small text-muted">Cost Price</div>
                    <h4>{formatCurrency(product.costPrice)}</h4>
                  </div>
                  
                  <div className="mb-3">
                    <div className="small text-muted">Selling Price</div>
                    <h4>{formatCurrency(product.sellingPrice)}</h4>
                  </div>
                  
                  <div className="mb-3">
                    <div className="small text-muted">Profit Margin</div>
                    <h4>
                      {Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)}%
                    </h4>
                  </div>
                  
                  <div>
                    <div className="small text-muted">Tax Rate</div>
                    <h4>{product.taxRate}%</h4>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inventory Status */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Inventory Status</h5>
              </div>
              <div className="card-body">
                <div className="inventory-status">
                  <div className="mb-3">
                    <div className="small text-muted">Current Stock</div>
                    <h4>
                      {renderStockBadge(product.currentStock, product.minimumStock)}{' '}
                      {product.currentStock}
                    </h4>
                  </div>
                  
                  <div className="mb-3">
                    <div className="small text-muted">Minimum Stock</div>
                    <h4>{product.minimumStock}</h4>
                  </div>
                  
                  <div className="mb-3">
                    <div className="small text-muted">Current Value</div>
                    <h4>{formatCurrency(product.currentStock * product.costPrice)}</h4>
                  </div>
                  
                  {product.location && (
                    <div>
                      <div className="small text-muted">Storage Location</div>
                      <h4>{product.location}</h4>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;