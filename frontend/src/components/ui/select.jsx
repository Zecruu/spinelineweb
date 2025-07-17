import React, { useState, useRef, useEffect } from 'react';
import './select.css';

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="select-container" ref={selectRef}>
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            isOpen, 
            setIsOpen, 
            value 
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, { 
            isOpen, 
            setIsOpen, 
            onValueChange 
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ className = '', isOpen, setIsOpen, value, children }) => {
  return (
    <button
      className={`select-trigger ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      type="button"
    >
      {children}
      <svg 
        className={`select-icon ${isOpen ? 'open' : ''}`}
        width="12" 
        height="12" 
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};

const SelectValue = ({ placeholder = "Select..." }) => {
  return <span className="select-value">{placeholder}</span>;
};

const SelectContent = ({ className = '', isOpen, setIsOpen, onValueChange, children }) => {
  if (!isOpen) return null;

  return (
    <div className={`select-content ${className}`}>
      {React.Children.map(children, (child) => {
        if (child.type === SelectItem) {
          return React.cloneElement(child, { 
            onValueChange, 
            setIsOpen 
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectItem = ({ value, disabled = false, onValueChange, setIsOpen, children }) => {
  const handleClick = () => {
    if (!disabled) {
      onValueChange(value);
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`select-item ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
