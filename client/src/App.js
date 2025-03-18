// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Alert from './components/layout/Alert';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import Dashboard from './components/dashboard/Dashboard';

// Products Components
import ProductsPage from './components/products/ProductsPage';
import ProductDetails from './components/products/ProductDetails';
import ProductForm from './components/products/ProductForm';

// POS Components
import POSSystem from './components/pos/POSSystem';

// Inventory Components
import InventoryDashboard from './components/inventory/InventoryDashboard';

// Reports Components
import ReportsDashboard from './components/reports/ReportsDashboard';

// Context
import AuthContext from './context/auth/authContext';
import AlertContext from './context/alert/alertContext';

// Utils
import setAuthToken from './utils/setAuthToken';

import './App.css';

// Check for token
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  const [alertState, setAlertState] = useState([]);

  // Load user data when component mounts if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
        
        try {
          const res = await axios.get('/api/auth');
          
          setAuthState({
            ...authState,
            isAuthenticated: true,
            user: res.data,
            loading: false
          });
        } catch (err) {
          localStorage.removeItem('token');
          setAuthState({
            ...authState,
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
            error: err.response?.data?.message || 'Authentication failed'
          });
        }
      } else {
        setAuthState({
          ...authState,
          loading: false
        });
      }
    };

    loadUser();
    // eslint-disable-next-line
  }, []);

  // Login user
  const login = async (email, password) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/auth', { email, password }, config);
      
      localStorage.setItem('token', res.data.token);
      
      setAuthState({
        ...authState,
        token: res.data.token,
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
    } catch (err) {
      setAuthState({
        ...authState,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: err.response?.data?.message || 'Login failed'
      });
      
      setAlert(err.response?.data?.message || 'Login failed', 'danger');
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      ...authState,
      token: null,
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  // Clear errors
  const clearErrors = () => {
    setAuthState({
      ...authState,
      error: null
    });
  };

  // Set alert
  const setAlert = (msg, type, timeout = 5000) => {
    const id = Math.random().toString(36).substring(7);
    setAlertState([...alertState, { id, msg, type }]);

    setTimeout(() => {
      setAlertState(alertState.filter(alert => alert.id !== id));
    }, timeout);
  };

  // Auth context value
  const authContextValue = {
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    logout,
    clearErrors
  };

  // Alert context value
  const alertContextValue = {
    alerts: alertState,
    setAlert
  };

  // Private route component
  const PrivateRoute = ({ children }) => {
    if (authState.loading) {
      return <div className="loading-spinner">Loading...</div>;
    }

    return authState.isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <AlertContext.Provider value={alertContextValue}>
        <Router>
          <div className="app">
            {authState.isAuthenticated && <Navbar />}
            <div className="container">
              <Alert />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <Dashboard />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/pos" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <POSSystem />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/inventory" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <InventoryDashboard />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/products" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <ProductsPage />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/products/:id" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <ProductDetails />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/products/add" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <ProductForm />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/products/edit/:id" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <ProductForm />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <div className="main-content">
                        {authState.isAuthenticated && <Sidebar />}
                        <div className="content-area">
                          <ReportsDashboard />
                        </div>
                      </div>
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </div>
            {authState.isAuthenticated && <Footer />}
          </div>
        </Router>
      </AlertContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
