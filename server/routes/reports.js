// routes/reports.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const auth = require('../middleware/auth');

// Helper for date range filtering
const getDateRange = (period) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Set to beginning of current week (Sunday)
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      // Custom dates will be handled separately
      return null;
    default:
      // Default to today
      startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate: now };
};

// Daily sales report
router.get('/sales/daily', auth, async (req, res) => {
  try {
    // Get parameters
    const { date } = req.query;
    const requestDate = date ? new Date(date) : new Date();
    
    // Set date range for the requested day
    const startDate = new Date(requestDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(requestDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Find sales for the day
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['Completed', 'Partially Refunded'] }
    });
    
    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxTotal, 0);
    
    // Get hourly breakdown
    const hourlyData = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
      revenue: 0
    }));
    
    sales.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours();
      hourlyData[hour].count++;
      hourlyData[hour].revenue += sale.total;
    });
    
    // Get payment method breakdown
    const paymentMethods = {};
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        const method = payment.method;
        if (!paymentMethods[method]) {
          paymentMethods[method] = 0;
        }
        paymentMethods[method] += payment.amount;
      });
    });
    
    // Get top selling products
    const productSales = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            name: item.name,
            barcode: item.barcode,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.total;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    res.json({
      date: requestDate.toISOString().split('T')[0],
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        netRevenue: totalRevenue - totalTax
      },
      hourlyBreakdown: hourlyData,
      paymentMethods,
      topProducts
    });
  } catch (err) {
    console.error('Error generating daily sales report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Weekly, monthly, yearly sales reports
router.get('/sales/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    const { startDate: customStartDate, endDate: customEndDate } = req.query;
    
    let dateRange;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      dateRange = {
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate)
      };
      
      // Set end of day for end date
      dateRange.endDate.setHours(23, 59, 59, 999);
    } else {
      dateRange = getDateRange(period);
      
      if (!dateRange) {
        return res.status(400).json({ message: 'Invalid period specified' });
      }
    }
    
    const { startDate, endDate } = dateRange;
    
    // Find sales for the period
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['Completed', 'Partially Refunded'] }
    });
    
    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxTotal, 0);
    const netRevenue = totalRevenue - totalTax;
    
    // Group data by date
    const salesByDate = {};
    
    sales.forEach(sale => {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = {
          date: dateKey,
          count: 0,
          revenue: 0,
          tax: 0
        };
      }
      
      salesByDate[dateKey].count++;
      salesByDate[dateKey].revenue += sale.total;
      salesByDate[dateKey].tax += sale.taxTotal;
    });
    
    // Convert to array and sort by date
    const dailyData = Object.values(salesByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Get category breakdown
    const categorySales = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Assuming product details have category information
        // You might need to populate this in your query if not directly available
        const category = item.category || 'Uncategorized';
        
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            count: 0,
            revenue: 0
          };
        }
        
        categorySales[category].count += item.quantity;
        categorySales[category].revenue += item.total;
      });
    });
    
    // Convert to array and sort by revenue
    const categoryData = Object.values(categorySales).sort((a, b) => 
      b.revenue - a.revenue
    );
    
    // Calculate average sale value
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    res.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        netRevenue,
        averageSaleValue
      },
      dailyBreakdown: dailyData,
      categoryBreakdown: categoryData
    });
  } catch (err) {
    console.error(`Error generating ${req.params.period} sales report:`, err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Inventory movement report
router.get('/inventory/movements', auth, async (req, res) => {
  try {
    const { startDate, endDate, productId, category, movementType } = req.query;
    
    // Build query filters
    const queryFilters = {};
    
    // Date range filter
    if (startDate && endDate) {
      queryFilters.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Product filter
    if (productId) {
      queryFilters.product = mongoose.Types.ObjectId(productId);
    }
    
    // Movement type filter
    if (movementType) {
      queryFilters.movementType = movementType;
    }
    
    // Get inventory movements
    let movements = await InventoryMovement.find(queryFilters)
      .populate('product', 'name barcode category')
      .populate('performedBy', 'name')
      .sort({ timestamp: -1 });
    
    // Additional filtering by category if specified
    if (category && !productId) {
      movements = movements.filter(m => 
        m.product && m.product.category === category
      );
    }
    
    // Group movements by type for summary
    const summaryByType = {};
    
    movements.forEach(movement => {
      const type = movement.movementType;
      
      if (!summaryByType[type]) {
        summaryByType[type] = {
          type,
          count: 0,
          totalQuantity: 0
        };
      }
      
      summaryByType[type].count++;
      summaryByType[type].totalQuantity += movement.quantity;
    });
    
    // Summary by product (top movers)
    const summaryByProduct = {};
    
    movements.forEach(movement => {
      if (!movement.product) return;
      
      const productId = movement.product._id.toString();
      
      if (!summaryByProduct[productId]) {
        summaryByProduct[productId] = {
          productId,
          name: movement.product.name,
          barcode: movement.product.barcode,
          category: movement.product.category,
          inQuantity: 0,
          outQuantity: 0,
          netMovement: 0
        };
      }
      
      const quantity = movement.quantity;
      
      // Incoming movements
      if (['Received', 'Returned', 'Adjustment'].includes(movement.movementType)) {
        summaryByProduct[productId].inQuantity += quantity;
        summaryByProduct[productId].netMovement += quantity;
      } 
      // Outgoing movements
      else if (['Sold', 'Damaged'].includes(movement.movementType)) {
        summaryByProduct[productId].outQuantity += quantity;
        summaryByProduct[productId].netMovement -= quantity;
      }
    });
    
    // Convert to arrays
    const typeSummary = Object.values(summaryByType);
    const productSummary = Object.values(summaryByProduct)
      .sort((a, b) => Math.abs(b.netMovement) - Math.abs(a.netMovement))
      .slice(0, 20); // Top 20 products with most movement
    
    res.json({
      dateRange: {
        start: startDate || 'All time',
        end: endDate || 'All time'
      },
      summary: {
        totalMovements: movements.length,
        byType: typeSummary
      },
      topMovingProducts: productSummary,
      movements: movements.map(m => ({
        id: m._id,
        product: m.product ? {
          id: m.product._id,
          name: m.product.name,
          barcode: m.product.barcode,
          category: m.product.category
        } : null,
        movementType: m.movementType,
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        reference: m.reference,
        notes: m.notes,
        location: m.location,
        performedBy: m.performedBy ? m.performedBy.name : 'Unknown',
        timestamp: m.timestamp
      })).slice(0, 100) // Limit to 100 movements for performance
    });
  } catch (err) {
    console.error('Error generating inventory movement report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Low stock report
router.get('/inventory/low-stock', auth, async (req, res) => {
  try {
    const { threshold, category } = req.query;
    
    // Build query filters
    const queryFilters = {};
    
    // Filter by category if specified
    if (category) {
      queryFilters.category = category;
    }
    
    // Filter by active products
    queryFilters.isActive = true;
    
    // Get products
    const products = await Product.find(queryFilters);
    
    // Filter low stock products
    const lowStockProducts = products.filter(product => {
      const thresholdValue = threshold 
        ? parseInt(threshold) 
        : product.minimumStock;
      
      return product.currentStock <= thresholdValue;
    });
    
    // Group by category
    const byCategory = {};
    
    lowStockProducts.forEach(product => {
      const category = product.category;
      
      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          count: 0,
          products: []
        };
      }
      
      byCategory[category].count++;
      byCategory[category].products.push({
        id: product._id,
        name: product.name,
        barcode: product.barcode,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        needsReorder: product.currentStock <= product.minimumStock
      });
    });
    
    // Convert to array
    const categorySummary = Object.values(byCategory);
    
    res.json({
      totalLowStock: lowStockProducts.length,
      byCategory: categorySummary,
      products: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        daysOfSupply: p.currentStock > 0 ? 
          Math.round(p.currentStock / (p.avgDailySales || 0.1)) : 0
      }))
    });
  } catch (err) {
    console.error('Error generating low stock report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;