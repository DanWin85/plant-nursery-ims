// src/components/pos/CategorySelector.js
import React from 'react';

export const CategorySelector = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-selector mb-3">
      <h5 className="mb-2">Categories</h5>
      <div className="d-flex flex-wrap gap-2">
        <button
          className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onSelectCategory('')}
        >
          All
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;