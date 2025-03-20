const mongoose = require('mongoose');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://your-atlas-connection-string/plant-nursery-ims')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample product data
const sampleProducts = [
  {
    name: 'Rose Plant',
    barcode: '29910000011',
    category: 'Flowers',
    description: 'Beautiful rose plant, red variety',
    costPrice: 5.99,
    sellingPrice: 12.99,
    taxRate: 15,
    currentStock: 50,
    minimumStock: 10,
    isActive: true
  },
  {
    name: 'Tomato Seedling',
    barcode: '29950000012',
    category: 'Vegetables',
    description: 'Cherry tomato seedling, ready to plant',
    costPrice: 2.49,
    sellingPrice: 4.99,
    taxRate: 15,
    currentStock: 100,
    minimumStock: 20,
    isActive: true
  },
  {
    name: 'Garden Shovel',
    barcode: '29980000013',
    category: 'Tools',
    description: 'Small garden shovel with wooden handle',
    costPrice: 8.50,
    sellingPrice: 15.99,
    taxRate: 15,
    currentStock: 25,
    minimumStock: 5,
    isActive: true
  }
];

// Sample sale data (for past 30 days)
const generateSampleSales = () => {
  const sales = [];
  const now = new Date();
  
  // Create sales for the past 30 days
  for (let i = 0; i < 30; i++) {
    const saleDate = new Date();
    saleDate.setDate(now.getDate() - i);
    
    // Generate 1-5 sales per day
    const salesPerDay = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < salesPerDay; j++) {
      const saleNumber = `S${saleDate.getFullYear().toString().slice(-2)}${(saleDate.getMonth() + 1).toString().padStart(2, '0')}${saleDate.getDate().toString().padStart(2, '0')}${(j+1).toString().padStart(4, '0')}`;
      
      // Random items in sale
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;
      let taxTotal = 0;
      
      for (let k = 0; k < itemCount; k++) {
        // Pick random product
        const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemSubtotal = product.sellingPrice * quantity;
        const itemTax = itemSubtotal * (product.taxRate / 100);
        
        items.push({
          product: new mongoose.Types.ObjectId(), // Fixed: Using 'new' with ObjectId
          barcode: product.barcode,
          name: product.name,
          quantity: quantity,
          pricePerUnit: product.sellingPrice,
          taxRate: product.taxRate,
          taxAmount: itemTax,
          subtotal: itemSubtotal,
          total: itemSubtotal + itemTax
        });
        
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }
      
      const total = subtotal + taxTotal;
      
      sales.push({
        saleNumber: saleNumber,
        items: items,
        subtotal: subtotal,
        taxTotal: taxTotal,
        total: total,
        status: 'Completed',
        cashier: new mongoose.Types.ObjectId('67d9283bf94ed4385ccc7b04'), // Fixed: Using 'new'
        registerNumber: 'POS-1',
        createdAt: saleDate,
        payments: [
          {
            method: Math.random() > 0.5 ? 'Cash' : 'Credit Card',
            amount: total
          }
        ]
      });
    }
  }
  
  return sales;
};

async function seedDatabase() {
  try {
    // Clear existing data
    await Product.deleteMany({});
    await Sale.deleteMany({});
    
    // Seed products
    const products = await Product.insertMany(sampleProducts);
    console.log(`${products.length} products added`);
    
    // Seed sales with actual product IDs
    const sales = generateSampleSales();
    // Update product references in sales with actual IDs
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.barcode === item.barcode);
        if (product) {
          item.product = product._id;
        }
      });
    });
    
    await Sale.insertMany(sales);
    console.log(`${sales.length} sales added`);
    
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedDatabase();