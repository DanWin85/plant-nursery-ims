const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Plant Nursery IMS API is running' });
  });

// API Routes 
// app.use('/api/products', require('./routes/products'));
// app.use('/api/barcode', require('./routes/barcode'));
// app.use('/api/sales', require('./routes/sales'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/reports', require('./routes/reports'));
// app.use('/api/auth', require('./routes/auth'));

// MongoDB Connection
const connectDb = async () => {
    try {
const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/plant-nursery-ims')
console.log('MongoDB Connected: ');
    }catch (error){
console.error('Error connecting to MongoDB: ');
process.exit(1)
    }
};

// Port and Start server
const PORT = process.env.PORT || 5000;

// Connect to DB and start server 
//connectDB().then(() => {
app.listen(PORT, () => {
console.log('Server running on ');
});
//});

//app.listen(PORT, () => {
//console.log('Server running on port ');
//});

