import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Login = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);

  const { login, isAuthenticated, error, clearErrors } = authContext;
  const { setAlert } = alertContext;

  const [user, setUser] = useState({
    email: '',
    password: ''
  });

  const { email, password } = user;

  useEffect(() => {
    if (error) {
      setAlert(error, 'danger');
      clearErrors();
    }
  }, [error, setAlert, clearErrors]);

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = e => {
    e.preventDefault();
    if (email === '' || password === '') {
      setAlert('Please fill in all fields', 'danger');
    } else {
      login(email, password);
    }
  };

  // Redirect if logged in
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login-container">
      <div className="form-container">
        <h1>
          <i className="fas fa-leaf"></i> Plant Nursery IMS
        </h1>
        <h2 className="mb-4">Account Login</h2>
        <form onSubmit={onSubmit}>
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
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;