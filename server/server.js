﻿const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Debug middleware to log all API requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Plant Nursery IMS API is running' });
});

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/barcode', require('./routes/barcode'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/suppliers', require('./routes/suppliers'));

// MongoDB Connection
const connectDB = async () => {
  try {
    // Use your MongoDB Atlas connection string here
    const conn = await mongoose.connect('mongodb+srv://danwingate85:h6XUkQydyLozpZL9@nursery-ims.0tsbp.mongodb.net/?retryWrites=true&w=majority&appName=Nursery-IMS');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Port and Start server
const PORT = process.env.PORT || 5000;

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});