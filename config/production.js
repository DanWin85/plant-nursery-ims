// config/production.js
module.exports = {
    // Production-specific settings that override default.js
    
    // Security settings
    jwtSecret: process.env.JWT_SECRET, // Must be set as environment variable in production
    
    // EFTPOS settings
    eftpos: {
      provider: process.env.EFTPOS_PROVIDER,
      terminalId: process.env.EFTPOS_TERMINAL_ID,
      merchantId: process.env.EFTPOS_MERCHANT_ID,
      apiKey: process.env.EFTPOS_API_KEY,
      apiUrl: process.env.EFTPOS_API_URL,
      timeout: process.env.EFTPOS_TIMEOUT || 120000 // 2 minute timeout in production
    }
  };