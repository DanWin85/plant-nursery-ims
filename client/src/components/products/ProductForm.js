// src/components/products/ProductForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AlertContext from '../../context/alert/alertContext';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id !== undefined;
  
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    subcategory: '',
    description: '',
    supplier: '',
    costPrice: '',
    sellingPrice: '',
    taxRate: '15',
    currentStock: '0',
    minimumStock: '5',
    location: '',
    isActive: true,
    plantDetails: {
      scientificName: '',
      growthHabit: '',
      careLevel: '',
      sunRequirement: '',
      wateringNeeds: '',
      seasonality: [],
      isPerennial: false,
      matureHeight: '',
      matureWidth: '',
      bloomTime: '',
      hardinessZone: ''
    }
  });
  
  // Additional state
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Pre-defined options
  const careLevels = ['Easy', 'Moderate', 'Difficult'];
  const sunRequirements = ['Full Sun', 'Partial Sun', 'Shade'];
  const wateringNeeds = ['Low', 'Medium', 'High'];
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  
  // Load categories and suppliers on component mount
  useEffect(() => {
    const fetchFormData = async () => {
      setLoading(true);
      
      try {
        // Fetch categories
        const categoriesRes = await axios.get('/api/products/categories');
        setCategories(categoriesRes.data);
        
        // Fetch suppliers
        const suppliersRes = await axios.get('/api/suppliers');
        setSuppliers(suppliersRes.data.suppliers || []);
        
        // If edit mode, fetch product data
        if (isEditMode) {
          const productRes = await axios.get(`/api/products/${id}`);
          const productData = productRes.data;
          
          // Format the data for the form
          setFormData({
            name: productData.name || '',
            barcode: productData.barcode || '',
            category: productData.category || '',
            subcategory: productData.subcategory || '',
            description: productData.description || '',
            supplier: productData.supplier || '',
            costPrice: productData.costPrice?.toString() || '',
            sellingPrice: productData.sellingPrice?.toString() || '',
            taxRate: productData.taxRate?.toString() || '15',
            currentStock: productData.currentStock?.toString() || '0',
            minimumStock: productData.minimumStock?.toString() || '5',
            location: productData.location || '',
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            plantDetails: {
              scientificName: productData.plantDetails?.scientificName || '',
              growthHabit: productData.plantDetails?.growthHabit || '',
              careLevel: productData.plantDetails?.careLevel || '',
              sunRequirement: productData.plantDetails?.sunRequirement || '',
              wateringNeeds: productData.plantDetails?.wateringNeeds || '',
              seasonality: productData.plantDetails?.seasonality || [],
              isPerennial: productData.plantDetails?.isPerennial || false,
              matureHeight: productData.plantDetails?.matureHeight?.toString() || '',
              matureWidth: productData.plantDetails?.matureWidth?.toString() || '',
              bloomTime: productData.plantDetails?.bloomTime || '',
              hardinessZone: productData.plantDetails?.hardinessZone || ''
            }
          });
        } else if (categories.length > 0) {
          // Set default category if available
          setFormData(prevState => ({
            ...prevState,
            category: categories[0]
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setAlert('Failed to load form data', 'danger');
        setLoading(false);
        
        // Redirect to products page if product not found in edit mode
        if (isEditMode && err.response && err.response.status === 404) {
          navigate('/products');
        }
      }
    };
    
    fetchFormData();
  }, [id, isEditMode, navigate, setAlert]);
  
  // Generate a new barcode if creating a new product
  useEffect(() => {
    const generateBarcode = async () => {
      if (!isEditMode && formData.category && !formData.barcode) {
        try {
          const res = await axios.post('/api/barcode/generate', {
            category: formData.category
          });
          
          setFormData(prevState => ({
            ...prevState,
            barcode: res.data.barcode
          }));
        } catch (err) {
          console.error('Error generating barcode:', err);
        }
      }
    };
    
    generateBarcode();
  }, [isEditMode, formData.category, formData.barcode]);
  
  // Handle general form input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle plant details form input changes
  const handlePlantDetailsChange = e => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      plantDetails: {
        ...prevState.plantDetails,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };
  
  // Handle seasonality checkboxes
  const handleSeasonalityChange = (season, checked) => {
    setFormData(prevState => {
      const currentSeasonality = [...prevState.plantDetails.seasonality];
      
      if (checked && !currentSeasonality.includes(season)) {
        currentSeasonality.push(season);
      } else if (!checked && currentSeasonality.includes(season)) {
        const index = currentSeasonality.indexOf(season);
        currentSeasonality.splice(index, 1);
      }
      
      return {
        ...prevState,
        plantDetails: {
          ...prevState.plantDetails,
          seasonality: currentSeasonality
        }
      };
    });
  };
  
  // Form submission handler
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Data validation
      if (!formData.name || !formData.barcode || !formData.category) {
        setAlert('Please fill in all required fields', 'danger');
        setSubmitting(false);
        return;
      }
      
      // Prepare form data for submission
      const productData = {
        name: formData.name,
        barcode: formData.barcode,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description,
        supplier: formData.supplier || null,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        taxRate: parseFloat(formData.taxRate) || 15,
        currentStock: isEditMode ? undefined : parseInt(formData.currentStock) || 0,
        minimumStock: parseInt(formData.minimumStock) || 5,
        location: formData.location,
        isActive: formData.isActive,
        plantDetails: {}
      };
      
      // Add plant details if they exist
      const plantDetails = formData.plantDetails;
      
      if (plantDetails.scientificName) productData.plantDetails.scientificName = plantDetails.scientificName;
      if (plantDetails.growthHabit) productData.plantDetails.growthHabit = plantDetails.growthHabit;
      if (plantDetails.careLevel) productData.plantDetails.careLevel = plantDetails.careLevel;
      if (plantDetails.sunRequirement) productData.plantDetails.sunRequirement = plantDetails.sunRequirement;
      if (plantDetails.wateringNeeds) productData.plantDetails.wateringNeeds = plantDetails.wateringNeeds;
      if (plantDetails.seasonality.length > 0) productData.plantDetails.seasonality = plantDetails.seasonality;
      if (plantDetails.isPerennial !== undefined) productData.plantDetails.isPerennial = plantDetails.isPerennial;
      
      if (plantDetails.matureHeight) productData.plantDetails.matureHeight = parseFloat(plantDetails.matureHeight);
      if (plantDetails.matureWidth) productData.plantDetails.matureWidth = parseFloat(plantDetails.matureWidth);
      if (plantDetails.bloomTime) productData.plantDetails.bloomTime = plantDetails.bloomTime;
      if (plantDetails.hardinessZone) productData.plantDetails.hardinessZone = plantDetails.hardinessZone;
      
      // If no plant details were added, don't include the empty object
      if (Object.keys(productData.plantDetails).length === 0) {
        delete productData.plantDetails;
      }
      
      let response;
      
      if (isEditMode) {
        // Update existing product
        response = await axios.put(`/api/products/${id}`, productData);
        setAlert('Product updated successfully', 'success');
      } else {
        // Create new product
        response = await axios.post('/api/products', productData);
        setAlert('Product created successfully', 'success');
      }
      
      // Redirect to the product detail page
      navigate(`/products/${response.data.product._id}`);
    } catch (err) {
      console.error('Error saving product:', err);
      setAlert(err.response?.data?.message || 'Failed to save product', 'danger');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="product-form">
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
          
          <Link to="/products" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left"></i> Back to Products
          </Link>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Main Form */}
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Basic Information</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="growthHabit" className="form-label">Growth Habit</label>
                      <input
                        type="text"
                        className="form-control"
                        id="growthHabit"
                        name="growthHabit"
                        value={formData.plantDetails.growthHabit}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label htmlFor="careLevel" className="form-label">Care Level</label>
                      <select
                        className="form-select"
                        id="careLevel"
                        name="careLevel"
                        value={formData.plantDetails.careLevel}
                        onChange={handlePlantDetailsChange}
                      >
                        <option value="">Select Care Level</option>
                        {careLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="sunRequirement" className="form-label">Sun Requirement</label>
                      <select
                        className="form-select"
                        id="sunRequirement"
                        name="sunRequirement"
                        value={formData.plantDetails.sunRequirement}
                        onChange={handlePlantDetailsChange}
                      >
                        <option value="">Select Sun Requirement</option>
                        {sunRequirements.map(req => (
                          <option key={req} value={req}>{req}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="wateringNeeds" className="form-label">Watering Needs</label>
                      <select
                        className="form-select"
                        id="wateringNeeds"
                        name="wateringNeeds"
                        value={formData.plantDetails.wateringNeeds}
                        onChange={handlePlantDetailsChange}
                      >
                        <option value="">Select Watering Needs</option>
                        {wateringNeeds.map(need => (
                          <option key={need} value={need}>{need}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Seasonality</label>
                      <div className="d-flex flex-wrap gap-3">
                        {seasons.map(season => (
                          <div key={season} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`season-${season}`}
                              checked={formData.plantDetails.seasonality.includes(season)}
                              onChange={e => handleSeasonalityChange(season, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`season-${season}`}>
                              {season}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Perennial</label>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isPerennial"
                          name="isPerennial"
                          checked={formData.plantDetails.isPerennial}
                          onChange={handlePlantDetailsChange}
                        />
                        <label className="form-check-label" htmlFor="isPerennial">
                          Yes, this is a perennial plant
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <label htmlFor="matureHeight" className="form-label">Mature Height (cm)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        id="matureHeight"
                        name="matureHeight"
                        value={formData.plantDetails.matureHeight}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label htmlFor="matureWidth" className="form-label">Mature Width (cm)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        id="matureWidth"
                        name="matureWidth"
                        value={formData.plantDetails.matureWidth}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label htmlFor="bloomTime" className="form-label">Bloom Time</label>
                      <input
                        type="text"
                        className="form-control"
                        id="bloomTime"
                        name="bloomTime"
                        value={formData.plantDetails.bloomTime}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label htmlFor="hardinessZone" className="form-label">Hardiness Zone</label>
                      <input
                        type="text"
                        className="form-control"
                        id="hardinessZone"
                        name="hardinessZone"
                        value={formData.plantDetails.hardinessZone}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Product Summary</h5>
                </div>
                <div className="card-body">
                  <div className="product-summary">
                    <div className="mb-4">
                      <div className="fw-bold">Category:</div>
                      <div>{formData.category || 'Not selected'}</div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="fw-bold">Pricing:</div>
                      <div>
                        Cost: ${parseFloat(formData.costPrice || 0).toFixed(2)}<br />
                        Selling: ${parseFloat(formData.sellingPrice || 0).toFixed(2)}
                      </div>
                      
                      {formData.costPrice && formData.sellingPrice && (
                        <div className="mt-2">
                          <span className="badge bg-info">
                            Margin: {Math.round(((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!isEditMode && (
                      <div className="mb-4">
                        <div className="fw-bold">Initial Stock:</div>
                        <div>{formData.currentStock || '0'} units</div>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className="fw-bold">Status:</div>
                      <div>
                        {formData.isActive ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-body">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {isEditMode ? 'Update Product' : 'Save Product'}
                      </>
                    )}
                  </button>
                  
                  <Link to="/products" className="btn btn-outline-secondary btn-lg w-100">
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;<label htmlFor="name" className="form-label">Product Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="barcode" className="form-label">Barcode <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="barcode"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        required
                        disabled={isEditMode} // Don't allow barcode to be changed in edit mode
                      />
                      {!isEditMode && !formData.barcode && (
                        <small className="text-muted">A barcode will be automatically generated when you select a category.</small>
                      )}
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label">Category <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="subcategory" className="form-label">Subcategory</label>
                      <input
                        type="text"
                        className="form-control"
                        id="subcategory"
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="supplier" className="form-label">Supplier</label>
                      <select
                        className="form-select"
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="location" className="form-label">Storage Location</label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Pricing & Inventory</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label htmlFor="costPrice" className="form-label">Cost Price <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          id="costPrice"
                          name="costPrice"
                          value={formData.costPrice}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="sellingPrice" className="form-label">Selling Price <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          id="sellingPrice"
                          name="sellingPrice"
                          value={formData.sellingPrice}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="taxRate" className="form-label">Tax Rate</label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="form-control"
                          id="taxRate"
                          name="taxRate"
                          value={formData.taxRate}
                          onChange={handleChange}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    {!isEditMode && (
                      <div className="col-md-4">
                        <label htmlFor="currentStock" className="form-label">Initial Stock</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="form-control"
                          id="currentStock"
                          name="currentStock"
                          value={formData.currentStock}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    
                    <div className={`col-md-${isEditMode ? '6' : '4'}`}>
                      <label htmlFor="minimumStock" className="form-label">Minimum Stock</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="form-control"
                        id="minimumStock"
                        name="minimumStock"
                        value={formData.minimumStock}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className={`col-md-${isEditMode ? '6' : '4'}`}>
                      <label className="form-label d-block">Status</label>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Plant Details</h5>
                  <span className="text-muted">Optional information specific to plants</span>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="scientificName" className="form-label">Scientific Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="scientificName"
                        name="scientificName"
                        value={formData.plantDetails.scientificName}
                        onChange={handlePlantDetailsChange}
                      />
                    </div>
                    
                    <div className="col-md-6">