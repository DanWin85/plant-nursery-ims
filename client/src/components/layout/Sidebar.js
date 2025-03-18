import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Sidebar = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  // Determine which menu items to show based on user role
  const isAdmin = user && user.role === 'admin';
  const isManager = user && (user.role === 'admin' || user.role === 'manager');
  const isInventory = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'inventory');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Main Menu</h3>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" end>
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/pos">
            <i className="fas fa-cash-register"></i> Point of Sale
          </NavLink>
        </li>
        
        {isInventory && (
          <li>
            <NavLink to="/inventory">
              <i className="fas fa-boxes"></i> Inventory
            </NavLink>
          </li>
        )}
        
        {isInventory && (
          <li>
            <NavLink to="/products">
              <i className="fas fa-seedling"></i> Products
            </NavLink>
          </li>
        )}
        
        {isManager && (
          <li>
            <NavLink to="/suppliers">
              <i className="fas fa-truck"></i> Suppliers
            </NavLink>
          </li>
        )}
        
        <li>
          <NavLink to="/customers">
            <i className="fas fa-users"></i> Customers
          </NavLink>
        </li>
        
        {isManager && (
          <li>
            <NavLink to="/reports">
              <i className="fas fa-chart-bar"></i> Reports
            </NavLink>
          </li>
        )}
        
        {isAdmin && (
          <li>
            <NavLink to="/users">
              <i className="fas fa-user-cog"></i> Users
            </NavLink>
          </li>
        )}
        
        {isAdmin && (
          <li>
            <NavLink to="/settings">
              <i className="fas fa-cogs"></i> Settings
            </NavLink>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;