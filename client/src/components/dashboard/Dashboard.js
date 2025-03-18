// src/components/dashboard/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

// Dashboard card component
const DashboardCard = ({ title, value, icon, color, link }) => {
  return (
    <div className="col-md-6 col-lg-3 mb-4">
      <Link to={link} className="text-decoration-none">
        <div className={`card dashboard-card bg-${color} text-white`}>
          <div className="card-body">
            <div className="row">
              <div className="col-8">
                <h5 className="card-title">{title}</h5>
                <h2 className="card-text">{value}</h2>
              </div>
              <div className="col-4 text-center">
                <i className={`fas ${icon} fa-3x`}></i>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  
  const { user } = authContext;
  const { setAlert } = alertContext;
  
  const [stats, setStats] = useState({
    productCount: 0,
    lowStockCount: 0,
    todaySales: 0,
    todayRevenue: 0,
    loading: true
  });
  
  const [recentSales, setRecentSales] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Products stats
        const productsRes = await axios.get('/api/products/stats/overview');
        
        // Today's sales
        const today = new Date().toISOString().split('T')[0];
        const salesRes = await axios.get(`/api/sales/daily?date=${today}`);
        
        // Recent sales
        const recentSalesRes = await axios.get('/api/sales?limit=5&sortBy=createdAt&sortOrder=desc');
        
        // Recent inventory movements
        const recentMovementsRes = await axios.get('/api/inventory/movements?limit=5&sortBy=timestamp&sortOrder=desc');
        
        setStats({
          productCount: productsRes.data.activeProducts || 0,
          lowStockCount: productsRes.data.lowStockProducts || 0,
          todaySales: salesRes.data.summary?.totalSales || 0,
          todayRevenue: salesRes.data.summary?.totalRevenue || 0,
          loading: false
        });
        
        setRecentSales(recentSalesRes.data.sales || []);
        setRecentMovements(recentMovementsRes.data.movements || []);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setAlert('Failed to load dashboard data', 'danger');
        setStats({
          ...stats,
          loading: false
        });
      }
    };
    
    fetchDashboardData();
  }, [setAlert, stats]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (stats.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      <div className="container-fluid p-4">
        <h1 className="mb-4">Dashboard</h1>
        
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-info">
              <h4 className="alert-heading">Welcome, {user && user.name}!</h4>
              <p>Here's what's happening today in your plant nursery.</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="row mb-4">
          <DashboardCard 
            title="Products" 
            value={stats.productCount} 
            icon="fa-seedling" 
            color="success" 
            link="/products" 
          />
          <DashboardCard 
            title="Low Stock" 
            value={stats.lowStockCount} 
            icon="fa-exclamation-triangle" 
            color="warning" 
            link="/inventory" 
          />
          <DashboardCard 
            title="Today's Sales" 
            value={stats.todaySales} 
            icon="fa-receipt" 
            color="primary" 
            link="/reports" 
          />
          <DashboardCard 
            title="Today's Revenue" 
            value={formatCurrency(stats.todayRevenue)} 
            icon="fa-dollar-sign" 
            color="info" 
            link="/reports" 
          />
        </div>
        
        {/* Recent Activity */}
        <div className="row">
          {/* Recent Sales */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Recent Sales</h4>
              </div>
              <div className="card-body">
                {recentSales.length === 0 ? (
                  <p className="text-center">No recent sales</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Sale #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map(sale => (
                          <tr key={sale._id}>
                            <td>
                              <Link to={`/sales/${sale._id}`}>
                                {sale.saleNumber}
                              </Link>
                            </td>
                            <td>{formatDate(sale.createdAt)}</td>
                            <td>{sale.items.length}</td>
                            <td>{formatCurrency(sale.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to="/reports" className="btn btn-sm btn-outline-primary">
                  View All Sales
                </Link>
              </div>
            </div>
          </div>
          
          {/* Recent Inventory Movements */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">Recent Inventory Changes</h4>
              </div>
              <div className="card-body">
                {recentMovements.length === 0 ? (
                  <p className="text-center">No recent inventory movements</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Type</th>
                          <th>Qty</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMovements.map(movement => (
                          <tr key={movement.id}>
                            <td>
                              {movement.product ? (
                                <Link to={`/products/${movement.product.id}`}>
                                  {movement.product.name}
                                </Link>
                              ) : (
                                'Unknown Product'
                              )}
                            </td>
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
                            <td>{formatDate(movement.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to="/inventory" className="btn btn-sm btn-outline-success">
                  View Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h4 className="mb-0">Quick Actions</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-2">
                    <Link to="/pos" className="btn btn-primary btn-lg w-100">
                      <i className="fas fa-cash-register me-2"></i> New Sale
                    </Link>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Link to="/products/add" className="btn btn-success btn-lg w-100">
                      <i className="fas fa-plus me-2"></i> Add Product
                    </Link>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Link to="/inventory" className="btn btn-warning btn-lg w-100">
                      <i className="fas fa-dolly me-2"></i> Stock Update
                    </Link>
                  </div>
                  <div className="col-md-3 mb-2">
                    <Link to="/reports" className="btn btn-info btn-lg w-100">
                      <i className="fas fa-chart-bar me-2"></i> Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};