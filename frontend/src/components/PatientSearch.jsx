import { useState, useEffect, useRef } from 'react';
import './PatientSearch.css';

const PatientSearch = ({
  token,
  onPatientSelect,
  placeholder = "Search patients...",
  showCreateNew = false,
  onCreateNew = null,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'recordNumber', 'firstName', 'lastName'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Search patients with debouncing
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        params.append('search', searchTerm.trim());
        params.append('searchField', searchFilter); // Always include searchField to trigger search mode
        params.append('limit', '20'); // Increased limit for better search results

        console.log('Searching for:', searchTerm.trim(), 'with filter:', searchFilter);
        console.log('Request URL:', `http://localhost:5001/api/patients?${params}`);

        const response = await fetch(
          `http://localhost:5001/api/patients?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setSearchResults(data.data.patients || []);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          console.error('Search failed:', data.message);
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Patient search error:', error);
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchFilter, token]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handlePatientSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get patient initials for avatar
  const getPatientInitials = (patient) => {
    const first = patient.firstName?.charAt(0) || '';
    const last = patient.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'P';
  };

  return (
    <div className={`patient-search ${className}`} ref={searchRef}>
      <div className="search-controls">
        <div className="search-filter">
          <select 
            value={searchFilter} 
            onChange={(e) => setSearchFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Fields</option>
            <option value="recordNumber">Record Number</option>
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
          </select>
        </div>
        
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
          />
          {isSearching && (
            <div className="search-loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="search-dropdown" ref={dropdownRef}>
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((patient, index) => (
                <div
                  key={patient._id}
                  className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="patient-avatar">
                    {getPatientInitials(patient)}
                  </div>
                  <div className="patient-info">
                    <div className="patient-name">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="patient-details">
                      <span className="patient-age">Age: {calculateAge(patient.dob)}</span>
                      <span className="patient-record">#{patient.recordNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {showCreateNew && onCreateNew && (
                <div className="search-result-item create-new" onClick={onCreateNew}>
                  <div className="patient-avatar create-avatar">
                    +
                  </div>
                  <div className="patient-info">
                    <div className="patient-name">Create New Patient</div>
                    <div className="patient-details">
                      <span>Add "{searchTerm}" as new patient</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-text">No patients found</div>
              {showCreateNew && onCreateNew && (
                <button className="btn-create-new" onClick={onCreateNew}>
                  Create New Patient
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
