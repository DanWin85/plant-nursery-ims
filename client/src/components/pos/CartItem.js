// src/components/pos/CartItem.js
import React, { useState } from 'react';

export const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      setQuantity(newQuantity);
    }
  };

  // Handle quantity update
  const handleUpdate = () => {
    if (quantity !== item.quantity) {
      onUpdateQuantity(item._id, quantity);
    }
    setIsEditing(false);
  };

  // Handle key press for quantity input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setQuantity(item.quantity);
      setIsEditing(false);
    }
  };

  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{item.name}</h6>
        <button 
          className="btn btn-sm btn-danger"
          onClick={() => onRemove(item._id)}
          aria-label="Remove item"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <small className="text-muted d-block">{formatCurrency(item.price)} each</small>
          <small className="text-muted d-block">Tax: {item.taxRate}%</small>
        </div>
        
        <div className="d-flex align-items-center">
          {isEditing ? (
            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                value={quantity}
                onChange={handleQuantityChange}
                onKeyDown={handleKeyPress}
                autoFocus
                min="1"
                max={item.stock}
                style={{ width: '60px' }}
              />
              <button 
                className="btn btn-sm btn-primary"
                onClick={handleUpdate}
              >
                <i className="fas fa-check"></i>
              </button>
            </div>
          ) : (
            <>
              <span className="me-2">
                Qty: {item.quantity}
              </span>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsEditing(true)}
                aria-label="Edit quantity"
              >
                <i className="fas fa-edit"></i>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-end">
        <strong>{formatCurrency(item.subtotal)}</strong>
      </div>
    </li>
  );
};

export default CartItem;