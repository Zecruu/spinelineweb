import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './Ledger.css';

const Ledger = ({ token, user }) => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    paymentStatus: '',
    paymentMethod: '',
    patientId: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch ledger entries
  const fetchLedgerEntries = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          queryParams.delete(key);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/ledger?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setLedgerEntries(data.data.ledgerEntries);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch ledger entries');
      }
    } catch (error) {
      console.error('Fetch ledger entries error:', error);
      setError('Failed to fetch ledger entries');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single ledger entry details
  const fetchLedgerDetails = async (entryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ledger/${entryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSelectedEntry(data.data.ledgerEntry);
        setShowDetailModal(true);
      } else {
        setError(data.message || 'Failed to fetch ledger details');
      }
    } catch (error) {
      console.error('Fetch ledger details error:', error);
      setError('Failed to fetch ledger details');
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchLedgerEntries(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchLedgerEntries(newPage);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) return timeString;
    
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours = hours - 12;
    }
    
    return `${hours}:${minutes} ${ampm}`;
  };

  // Get payment status badge class
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'partial': return 'status-partial';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-overdue';
      default: return 'status-unknown';
    }
  };

  // Initial load
  useEffect(() => {
    fetchLedgerEntries();
  }, []);

  return (
    <div className="ledger-page">
      <div className="page-header">
        <h1>📊 Financial Ledger</h1>
        <p>Track billing activities, payments, and financial records</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Patient name, record #, billing codes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-group">
            <label>Payment Status:</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Payment Method:</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="filter-select"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="insurance">Insurance</option>
              <option value="package">Package</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn-search" disabled={loading}>
              🔍 Search
            </button>
            <button 
              onClick={() => {
                setFilters({
                  search: '',
                  startDate: '',
                  endDate: '',
                  paymentStatus: '',
                  paymentMethod: '',
                  patientId: ''
                });
                fetchLedgerEntries(1);
              }} 
              className="btn-clear"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="error-close">✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading ledger entries...</span>
        </div>
      )}

      {/* Ledger Table */}
      {!loading && (
        <div className="ledger-table-container">
          <div className="table-header">
            <h3>Ledger Entries</h3>
            <span className="entry-count">{pagination.totalEntries} entries</span>
          </div>
          
          <div className="table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Visit Type</th>
                  <th>Billing Codes</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => (
                    <tr key={entry._id} className="ledger-row">
                      <td className="date-cell">
                        {formatDate(entry.visitDate)}
                      </td>
                      <td className="patient-cell">
                        <div className="patient-info">
                          <div className="patient-name">
                            {entry.patient?.firstName} {entry.patient?.lastName}
                          </div>
                          <div className="patient-record">
                            #{entry.patient?.recordNumber}
                          </div>
                        </div>
                      </td>
                      <td className="visit-type-cell">
                        <span className={`visit-badge ${entry.visitType?.toLowerCase()}`}>
                          {entry.visitType}
                        </span>
                      </td>
                      <td className="billing-codes-cell">
                        {entry.billingCodes?.length > 0 ? (
                          <div className="billing-codes-list">
                            {entry.billingCodes.slice(0, 2).map((code, index) => (
                              <span key={index} className="billing-code">
                                {code.code}
                              </span>
                            ))}
                            {entry.billingCodes.length > 2 && (
                              <span className="more-codes">
                                +{entry.billingCodes.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="no-codes">No codes</span>
                        )}
                      </td>
                      <td className="amount-cell">
                        {formatCurrency(entry.totalAmount)}
                      </td>
                      <td className="paid-cell">
                        {formatCurrency(entry.amountPaid)}
                      </td>
                      <td className="method-cell">
                        <span className={`payment-method ${entry.paymentMethod}`}>
                          {entry.paymentMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`payment-status ${getPaymentStatusClass(entry.paymentStatus)}`}>
                          {entry.paymentStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => fetchLedgerDetails(entry._id)}
                          className="btn-view-details"
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-entries">
                      No ledger entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEntry && (
        <div className="modal-overlay">
          <div className="modal-content ledger-detail-modal">
            <div className="modal-header">
              <h3>Ledger Entry Details</h3>
              <button
                className="btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Patient Information */}
              <div className="detail-section">
                <h4>Patient Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedEntry.patientId?.firstName} {selectedEntry.patientId?.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Record #:</label>
                    <span>#{selectedEntry.patientId?.recordNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedEntry.patientId?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedEntry.patientId?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="detail-section">
                <h4>Visit Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{formatDate(selectedEntry.visitDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedEntry.visitType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Provider:</label>
                    <span>{selectedEntry.providerName}</span>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="detail-section">
                <h4>Billing Codes</h4>
                <div className="billing-codes-detail">
                  {selectedEntry.billingCodes?.map((code, index) => (
                    <div key={index} className="billing-code-detail">
                      <div className="code-header">
                        <span className="code-number">{code.code}</span>
                        <span className="code-total">{formatCurrency(code.totalPrice)}</span>
                      </div>
                      <div className="code-description">{code.description}</div>
                      <div className="code-details">
                        Units: {code.units} × {formatCurrency(code.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="detail-section">
                <h4>Payment Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Subtotal:</label>
                    <span>{formatCurrency(selectedEntry.subtotal)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Discount:</label>
                    <span>{formatCurrency(selectedEntry.totalDiscount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Amount:</label>
                    <span className="total-amount">{formatCurrency(selectedEntry.totalAmount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount Paid:</label>
                    <span>{formatCurrency(selectedEntry.amountPaid)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Method:</label>
                    <span className={`payment-method ${selectedEntry.paymentMethod}`}>
                      {selectedEntry.paymentMethod?.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Status:</label>
                    <span className={`payment-status ${getPaymentStatusClass(selectedEntry.paymentStatus)}`}>
                      {selectedEntry.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                  {selectedEntry.balance !== 0 && (
                    <div className="detail-item">
                      <label>Balance:</label>
                      <span className={selectedEntry.balance > 0 ? 'balance-owed' : 'balance-credit'}>
                        {formatCurrency(selectedEntry.balance)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Information */}
              {selectedEntry.signature && (
                <div className="detail-section">
                  <h4>Digital Signature</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Signed By:</label>
                      <span>{selectedEntry.signature.signedBy}</span>
                    </div>
                    <div className="detail-item">
                      <label>Timestamp:</label>
                      <span>{new Date(selectedEntry.signature.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visit Notes */}
              {selectedEntry.visitNotes && (
                <div className="detail-section">
                  <h4>Visit Notes</h4>
                  <div className="visit-notes">
                    {selectedEntry.visitNotes}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-close-modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
