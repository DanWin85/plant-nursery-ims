// src/components/pos/BarcodeScanner.js
import React, { useState, useRef, useEffect } from 'react';

export const BarcodeScanner = ({ onScan }) => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode);
      setBarcode('');
    }
  };

  const handleKeyDown = (e) => {
    // Handle Enter key press
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="barcode-scanner">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Scan barcode or enter product code"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            aria-label="Barcode input"
          />
          <button 
            className="btn btn-primary" 
            type="submit"
          >
            <i className="fas fa-search"></i> Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default BarcodeScanner;