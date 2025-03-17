// client/src/components/reports/ReportsDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Table, Spinner, Alert } from 'react-bootstrap';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';

const ReportsDashboard = () => {
  // State management
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Load initial report on component mount
  useEffect(() => {
    fetchReport();
  }, []);
  
  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      let endpoint;
      let params = {};
      
      switch (reportType) {
        case 'daily':
          endpoint = '/api/reports/sales/daily';
          break;
        case 'weekly':
          endpoint = '/api/reports/sales/week';
          break;
        case 'monthly':
          endpoint = '/api/reports/sales/month';
          break;
        case 'yearly':
          endpoint = '/api/reports/sales/year';
          break;
        case 'custom':
          endpoint = '/api/reports/sales/custom';
          params = {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
          };
          break;
        default:
          endpoint = '/api/reports/sales/daily';
      }
      
      const res = await axios.get(endpoint, { params });
      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data');
      setLoading(false);
    }
  };
  
  // Handle report type change
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setDateRange({
      startDate: start,
      endDate: end
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Generate Excel report
  const exportToExcel = () => {
    // This is a placeholder - in a real implementation,
    // you would call an API endpoint that returns an Excel file
    axios.get('/api/reports/export', {
      params: {
        type: reportType,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      },
      responseType: 'blob'
    }).then(response => {
      const fileName = `${reportType}-sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([response.data]), fileName);
    }).catch(err => {
      setError('Failed to export report');
    });
  };
  
  // Generate PDF report
  const exportToPDF = () => {
    // Similar to Excel export, but for PDF
    axios.get('/api/reports/export', {
      params: {
        type: reportType,
        format: 'pdf',
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      },
      responseType: 'blob'
    }).then(response => {
      const fileName = `${reportType}-sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(new Blob([response.data]), fileName);
    }).catch(err => {
      setError('Failed to export report');
    });
  };
  
  // Render sales summary
  const renderSalesSummary = () => {
    if (!reportData || !reportData.summary) return null;
    
    const { totalSales, totalRevenue, totalTax, netRevenue, averageSaleValue } = reportData.summary;
    
    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{totalSales}</h3>
              <Card.Title>Total Sales</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{formatCurrency(totalRevenue)}</h3>
              <Card.Title>Total Revenue</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{formatCurrency(netRevenue)}</h3>
              <Card.Title>Net Revenue</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3>{formatCurrency(averageSaleValue || 0)}</h3>
              <Card.Title>Avg. Sale</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };
  
  // Render sales trends
  const renderSalesTrends = () => {
    if (!reportData || !reportData.dailyBreakdown) return null;
    
    const dailyData = reportData.dailyBreakdown;
    
    return (
      <Card className="mb-4">
        <Card.Header>
          <h4>Sales Trends</h4>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Sales Count" 
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="Revenue" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };
  
  // Render category breakdown
  const renderCategoryBreakdown = () => {
    if (!reportData || !reportData.categoryBreakdown) return null;
    
    const categoryData = reportData.categoryBreakdown;
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B'];
    
    return (
      <Card className="mb-4">
        <Card.Header>
          <h4>Sales by Category</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="category"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col md={6}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((category, index) => (
                    <tr key={index}>
                      <td>{category.category}</td>
                      <td>{category.count}</td>
                      <td>{formatCurrency(category.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  // Render payment methods
  const renderPaymentMethods = () => {
    if (!reportData || !reportData.paymentMethods) return null;
    
    const paymentData = Object.entries(reportData.paymentMethods).map(([method, amount]) => ({
      method,
      amount
    }));
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    
    return (
      <Card className="mb-4">
        <Card.Header>
          <h4>Payment Methods</h4>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="method"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };
  
  // Render top products
  const renderTopProducts = () => {
    if (!reportData || !reportData.topProducts) return null;
    
    return (
      <Card className="mb-4">
        <Card.Header>
          <h4>Top Selling Products</h4>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Barcode</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topProducts.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{product.name}</td>
                  <td>{product.barcode}</td>
                  <td>{product.quantity}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <Container fluid className="reports-dashboard">
      <Row className="mb-3">
        <Col>
          <h2>Sales Reports</h2>
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-2">
          <Col>
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Report Type</Form.Label>
            <Form.Select 
              value={reportType} 
              onChange={handleReportTypeChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Date Range</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        {reportType === 'custom' && (
          <Col md={5}>
            <Form.Group>
              <Form.Label>Date Range</Form.Label>
              <DatePicker
                selected={dateRange.startDate}
                onChange={handleDateRangeChange}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                selectsRange
                className="form-control"
              />
            </Form.Group>
          </Col>
        )}
        
        <Col md={4} className="d-flex align-items-end">
          <Button variant="primary" onClick={fetchReport} className="me-2">
            Generate Report
          </Button>
          <Button variant="outline-secondary" onClick={exportToExcel} className="me-2">
            Export Excel
          </Button>
          <Button variant="outline-secondary" onClick={exportToPDF}>
            Export PDF
          </Button>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : reportData ? (
        <>
          {renderSalesSummary()}
          
          <Tabs defaultActiveKey="trends" className="mb-3">
            <Tab eventKey="trends" title="Sales Trends">
              {renderSalesTrends()}
            </Tab>
            <Tab eventKey="categories" title="Category Breakdown">
              {renderCategoryBreakdown()}
            </Tab>
            <Tab eventKey="payments" title="Payment Methods">
              {renderPaymentMethods()}
            </Tab>
            <Tab eventKey="products" title="Top Products">
              {renderTopProducts()}
            </Tab>
          </Tabs>
        </>
      ) : (
        <Card>
          <Card.Body className="text-center">
            <p>Select report type and date range, then click "Generate Report"</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ReportsDashboard;