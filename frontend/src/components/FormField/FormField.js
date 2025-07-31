// frontend/src/components/FormField/FormField.js
import React from 'react';
import './FormField.css';

const FormField = ({ label, children, error, required = false }) => {
  return (
    <div className={`form-field ${error ? 'error' : ''}`}>
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      <div className="field-input">
        {children}
      </div>
      
      {error && (
        <div className="field-error">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default FormField;
