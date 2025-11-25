import React from 'react';

/**
 * Input Component
 * Reusable input field with label and error handling
 */

const Input = ({ 
  label, 
  id, 
  error, 
  required = false, 
  className = '', 
  type = 'text',
  ...props 
}) => {
  const inputClasses = `block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        id={id}
        type={type}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
