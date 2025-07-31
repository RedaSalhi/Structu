// frontend/src/components/Button/Button.js
import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const buttonClass = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
};

export default Button;
