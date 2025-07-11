import { useState, useEffect } from 'react';
import './PatientFilters.css';

const PatientFilters = ({ filters, setFilters, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const visitTypes = [
    'Chiropractic',
    'Decompression',
    'Matrix',
    'New Patient',
    'Follow-up',
    'Consultation',
    'Therapy',
    'Massage'
  ];

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      patientType: '',
      searchTerm: '',
      providerId: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="patient-filters-panel">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="filters-content">
        {/* Search Bar */}
        <div className="filter-group">
          <label htmlFor="search-input">Search Patient</label>
          <div className="search-input-container">
            <input
              id="search-input"
              type="text"
              placeholder="Search by name or record number..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="search-input"
            />
            {filters.searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => handleFilterChange('searchTerm', '')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Visit Type Filter */}
        <div className="filter-group">
          <label htmlFor="visit-type-select">Visit Type</label>
          <select
            id="visit-type-select"
            value={filters.patientType}
            onChange={(e) => handleFilterChange('patientType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Visit Types</option>
            {visitTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Filter */}
        <div className="filter-group">
          <label htmlFor="provider-select">Provider</label>
          <select
            id="provider-select"
            value={filters.providerId}
            onChange={(e) => handleFilterChange('providerId', e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="">All Providers</option>
            {providers.map(provider => (
              <option key={provider._id} value={provider._id}>
                Dr. {provider.name || provider.username}
              </option>
            ))}
          </select>
          {loading && <span className="loading-text">Loading providers...</span>}
        </div>

        {/* Filter Actions */}
        <div className="filter-actions">
          <button
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            🗑️ Clear All
          </button>
          
          <div className="active-filters-count">
            {hasActiveFilters && (
              <span>
                {Object.values(filters).filter(value => value !== '').length} filter{Object.values(filters).filter(value => value !== '').length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <h4>Quick Filters</h4>
          <div className="quick-filter-buttons">
            <button
              className={`quick-filter-btn ${filters.patientType === 'New Patient' ? 'active' : ''}`}
              onClick={() => handleFilterChange('patientType', filters.patientType === 'New Patient' ? '' : 'New Patient')}
            >
              🆕 New Patients
            </button>
            
            <button
              className={`quick-filter-btn ${filters.patientType === 'Chiropractic' ? 'active' : ''}`}
              onClick={() => handleFilterChange('patientType', filters.patientType === 'Chiropractic' ? '' : 'Chiropractic')}
            >
              🦴 Chiropractic
            </button>
            
            <button
              className={`quick-filter-btn ${filters.patientType === 'Decompression' ? 'active' : ''}`}
              onClick={() => handleFilterChange('patientType', filters.patientType === 'Decompression' ? '' : 'Decompression')}
            >
              🔧 Decompression
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="filter-summary">
            <h4>Active Filters:</h4>
            <div className="active-filters-list">
              {filters.searchTerm && (
                <div className="active-filter-item">
                  <span className="filter-label">Search:</span>
                  <span className="filter-value">"{filters.searchTerm}"</span>
                  <button
                    className="remove-filter-btn"
                    onClick={() => handleFilterChange('searchTerm', '')}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {filters.patientType && (
                <div className="active-filter-item">
                  <span className="filter-label">Type:</span>
                  <span className="filter-value">{filters.patientType}</span>
                  <button
                    className="remove-filter-btn"
                    onClick={() => handleFilterChange('patientType', '')}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {filters.providerId && (
                <div className="active-filter-item">
                  <span className="filter-label">Provider:</span>
                  <span className="filter-value">
                    {providers.find(p => p._id === filters.providerId)?.name || 'Selected Provider'}
                  </span>
                  <button
                    className="remove-filter-btn"
                    onClick={() => handleFilterChange('providerId', '')}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientFilters;
