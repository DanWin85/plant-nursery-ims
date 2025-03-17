// config/default.js
module.exports = {
    // Default configuration (for development)
    port: process.env.PORT || 5000,
    
    // MongoDB connection string
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/plant-nursery-ims',
    
    // JWT (JSON Web Token) configuration
    jwtSecret: process.env.JWT_SECRET || 'plant-nursery-secret-key',
    jwtExpiration: '8h',
    
    // EFTPOS integration configuration
    eftpos: {
      provider: process.env.EFTPOS_PROVIDER || 'mock', // 'mock', 'windcave', 'verifone', 'smartpay'
      terminalId: process.env.EFTPOS_TERMINAL_ID || 'TERMINAL01',
      merchantId: process.env.EFTPOS_MERCHANT_ID || 'MERCHANT01',
      apiKey: process.env.EFTPOS_API_KEY || 'test-api-key',
      apiUrl: process.env.EFTPOS_API_URL || 'https://api.example.com/eftpos',
      timeout: process.env.EFTPOS_TIMEOUT || 60000 // 1 minute timeout
    },
    
    // Email configuration for receipts
    email: {
      from: process.env.EMAIL_FROM || 'sales@plantnursery.example.com',
      smtpServer: process.env.SMTP_SERVER || 'smtp.example.com',
      smtpPort: process.env.SMTP_PORT || 587,
      smtpUser: process.env.SMTP_USER || 'user',
      smtpPassword: process.env.SMTP_PASSWORD || 'password'
    },
    
    // Application settings
    app: {
      name: 'Plant Nursery IMS',
      company: 'Green Thumb Gardens',
      address: '123 Garden Street, Plantville',
      phone: '(555) 123-4567',
      website: 'www.greenthumbgardens.example.com',
      taxNumber: '123-456-789',
      currencySymbol: '$',
      currencyCode: 'NZD'
    }
  };