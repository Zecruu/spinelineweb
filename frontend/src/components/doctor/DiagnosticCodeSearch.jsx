import React, { useState, useEffect, useRef } from 'react';
import './DiagnosticCodeSearch.css';

const DiagnosticCodeSearch = ({ onAddCode, availableCodes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = availableCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCodes(filtered.slice(0, 10)); // Limit to 10 results
      setShowDropdown(true);
      setSelectedIndex(-1);
    } else {
      setFilteredCodes([]);
      setShowDropdown(false);
    }
  }, [searchTerm, availableCodes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCodes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCodes[selectedIndex]) {
          handleSelectCode(filteredCodes[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectCode = (code) => {
    onAddCode(code);
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    searchRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="diagnostic-code-search" ref={dropdownRef}>
      <div className="search-input-container">
        <input
          ref={searchRef}
          type="text"
          className="diagnostic-search-input"
          placeholder="Search diagnostic codes (ICD-10)..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />
        <div className="search-icon">🔍</div>
      </div>

      {showDropdown && filteredCodes.length > 0 && (
        <div className="diagnostic-dropdown">
          <div className="dropdown-header">
            <span className="results-count">
              {filteredCodes.length} result{filteredCodes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="dropdown-list">
            {filteredCodes.map((code, index) => (
              <div
                key={`${code.code}-${index}`}
                className={`dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectCode(code)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="code-info">
                  <div className="code-number">{code.code}</div>
                  <div className="code-description">{code.description}</div>
                </div>
                <button className="add-diagnosis-btn">
                  Add Diagnosis
                </button>
              </div>
            ))}
          </div>
          {filteredCodes.length === 10 && (
            <div className="dropdown-footer">
              <small>Showing first 10 results. Type more to narrow search.</small>
            </div>
          )}
        </div>
      )}

      {showDropdown && filteredCodes.length === 0 && searchTerm.length > 0 && (
        <div className="diagnostic-dropdown">
          <div className="dropdown-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No diagnostic codes found</div>
            <div className="empty-subtext">Try a different search term</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticCodeSearch;
