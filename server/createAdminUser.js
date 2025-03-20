const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://danwingate85:h6XUkQydyLozpZL9@nursery-ims.0tsbp.mongodb.net/?retryWrites=true&w=majority&appName=Nursery-IMS')
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Check if admin user exists
      const adminExists = await User.findOne({ email: 'admin@example.com' });
      
      if (adminExists) {
        console.log('Admin user already exists');
      } else {
        // Create admin user
        const admin = new User({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123', // Will be hashed by the schema pre-save hook
          role: 'admin',
          isActive: true
        });
        
        await admin.save();
        console.log('Admin user created successfully');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });