import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Register = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);

  const { isAuthenticated, error, clearErrors, login } = authContext;
  const { setAlert } = alertContext;

  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'cashier'
  });

  const { name, email, password, password2, role } = user;

  useEffect(() => {
    if (error) {
      setAlert(error, 'danger');
      clearErrors();
    }
  }, [error, setAlert, clearErrors]);

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (name === '' || email === '' || password === '') {
      setAlert('Please enter all fields', 'danger');
    } else if (password !== password2) {
      setAlert('Passwords do not match', 'danger');
    } else if (password.length < 6) {
      setAlert('Password must be at least 6 characters', 'danger');
    } else {
      // Register user (only admin can add users)
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        await axios.post('/api/users', { name, email, password, role }, config);
        
        setAlert('User registered successfully', 'success');
        
        // Login after registration
        login(email, password);
      } catch (err) {
        setAlert(err.response.data.message || 'Registration failed', 'danger');
      }
    }
  };

  // Redirect if logged in
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="register-container">
      <div className="form-container">
        <h1>
          <i className="fas fa-leaf"></i> Plant Nursery IMS
        </h1>
        <h2 className="mb-4">Account Registration</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="form-control"
              required
              minLength="6"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password2" className="form-label">Confirm Password</label>
            <input
              id="password2"
              type="password"
              name="password2"
              value={password2}
              onChange={onChange}
              className="form-control"
              required
              minLength="6"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={onChange}
              className="form-select"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;