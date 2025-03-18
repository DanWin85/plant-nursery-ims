// src/components/pos/ProductGrid.js
import React from 'react';

export const ProductGrid = ({ products, onProductClick }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (products.length === 0) {
    return (
      <div className="alert alert-info text-center">
        No products found. Try different search criteria.
      </div>
    );
  }

  return (
    <div className="product-grid">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
        {products.map(product => (
          <div key={product._id} className="col">
            <div 
              className="card h-100 product-card"
              onClick={() => onProductClick(product)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <h5 className="card-title">{product.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{product.barcode}</h6>
                <p className="card-text mb-1">
                  {product.category} {product.subcategory ? `- ${product.subcategory}` : ''}
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-5 fw-bold">{formatCurrency(product.sellingPrice)}</span>
                  <span>
                    Stock: {' '}
                    <span className={`badge ${
                      product.currentStock <= 0 ? 'bg-danger' : 
                      product.currentStock <= product.minimumStock ? 'bg-warning' : 
                      'bg-success'
                    }`}>
                      {product.currentStock}
                    </span>
                  </span>
                </div>
              </div>
              <div className="card-footer d-grid">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductClick(product);
                  }}
                >
                  <i className="fas fa-plus-circle me-1"></i> Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;