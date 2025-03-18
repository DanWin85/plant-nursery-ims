import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container text-center">
        <span className="text-muted">
          &copy; {year} Plant Nursery Inventory Management System
        </span>
      </div>
    </footer>
  );
};

export default Footer;