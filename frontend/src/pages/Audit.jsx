import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import PatientSearch from '../components/PatientSearch';
import './Audit.css';

const Audit = ({ token, user }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    visitType: '',
    providerId: '',
    missingSignature: false,
    missingNotes: false,
    copayOverride: false,
    patientId: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch audit logs
  const fetchAuditLogs = async (page = 1) => {
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
        if (!filters[key] || filters[key] === false) {
          queryParams.delete(key);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/audit?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setAuditLogs(data.data.auditLogs);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Fetch audit logs error:', error);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch compliance summary
  const fetchComplianceSummary = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`${API_BASE_URL}/api/audit/reports/compliance?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setComplianceSummary(data.data.compliance);
      }
    } catch (error) {
      console.error('Fetch compliance summary error:', error);
    }
  };

  // Fetch single audit log details
  const fetchAuditDetails = async (logId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/${logId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSelectedLog(data.data.auditLog);
        setShowDetailModal(true);
      } else {
        setError(data.message || 'Failed to fetch audit details');
      }
    } catch (error) {
      console.error('Fetch audit details error:', error);
      setError('Failed to fetch audit details');
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFilters(prev => ({
      ...prev,
      patientId: patient._id
    }));
    setShowPatientSearch(false);
  };

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setFilters(prev => ({
      ...prev,
      patientId: ''
    }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAuditLogs(1);
    fetchComplianceSummary();
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchAuditLogs(newPage);
  };

  // Handle log selection for export
  const handleLogSelection = (logId) => {
    setSelectedLogs(prev => {
      if (prev.includes(logId)) {
        return prev.filter(id => id !== logId);
      } else {
        return [...prev, logId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!auditLogs || auditLogs.length === 0) return;

    if (selectedLogs.length === auditLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(auditLogs.map(log => log._id));
    }
  };

  // Export selected logs as PDF
  const handleExportPDF = async () => {
    if (selectedLogs.length === 0) {
      setError('Please select at least one record to export');
      return;
    }

    try {
      // This would typically call a PDF generation endpoint
      // For now, we'll show a placeholder
      alert(`Exporting ${selectedLogs.length} records to PDF...`);
      setSelectedLogs([]);
    } catch (error) {
      console.error('Export PDF error:', error);
      setError('Failed to export PDF');
    }
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

  // Get compliance flag class
  const getComplianceFlagClass = (hasFlag) => {
    return hasFlag ? 'compliance-flag-error' : 'compliance-flag-ok';
  };

  // Initial load
  useEffect(() => {
    fetchAuditLogs();
    fetchComplianceSummary();
  }, []);

  return (
    <div className="audit-page">
      <div className="page-header">
        <h1>🔍 Compliance Audit</h1>
        <p>Documentation and audit trails for insurance compliance</p>
      </div>

      {/* Compliance Summary */}
      {complianceSummary && (
        <div className="compliance-summary">
          <h3>Compliance Overview</h3>
          <div className="compliance-stats">
            <div className="stat-item">
              <div className="stat-number">{complianceSummary.totalRecords}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-item error">
              <div className="stat-number">{complianceSummary.missingSignatures}</div>
              <div className="stat-label">Missing Signatures</div>
            </div>
            <div className="stat-item error">
              <div className="stat-number">{complianceSummary.missingNotes}</div>
              <div className="stat-label">Missing Notes</div>
            </div>
            <div className="stat-item warning">
              <div className="stat-number">{complianceSummary.copayOverrides}</div>
              <div className="stat-label">Copay Overrides</div>
            </div>
            <div className="stat-item warning">
              <div className="stat-number">{complianceSummary.incompleteSOAP}</div>
              <div className="stat-label">Incomplete SOAP</div>
            </div>
            <div className="stat-item error">
              <div className="stat-number">{complianceSummary.missingDiagnosis}</div>
              <div className="stat-label">Missing Diagnosis</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Patient name, record #, codes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Patient:</label>
            <div className="patient-search-container">
              {selectedPatient ? (
                <div className="selected-patient-filter">
                  <span className="patient-name">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                  <span className="patient-record">#{selectedPatient.recordNumber}</span>
                  <button
                    onClick={clearPatientSelection}
                    className="btn-clear-patient"
                    title="Clear patient selection"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPatientSearch(true)}
                  className="btn-select-patient"
                >
                  🔍 Select Patient
                </button>
              )}
            </div>
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
            <label>Visit Type:</label>
            <select
              value={filters.visitType}
              onChange={(e) => handleFilterChange('visitType', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="New">New Patient</option>
              <option value="Regular">Regular Visit</option>
              <option value="Re-Eval">Re-Evaluation</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Consultation">Consultation</option>
              <option value="Decompression">Decompression</option>
              <option value="Chiropractic">Chiropractic</option>
              <option value="Evaluation">Evaluation</option>
            </select>
          </div>
          <div className="compliance-filters">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.missingSignature}
                onChange={(e) => handleFilterChange('missingSignature', e.target.checked)}
              />
              Missing Signature
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.missingNotes}
                onChange={(e) => handleFilterChange('missingNotes', e.target.checked)}
              />
              Missing Notes
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.copayOverride}
                onChange={(e) => handleFilterChange('copayOverride', e.target.checked)}
              />
              Copay Override
            </label>
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
                  visitType: '',
                  providerId: '',
                  missingSignature: false,
                  missingNotes: false,
                  copayOverride: false,
                  patientId: ''
                });
                setSelectedPatient(null);
                fetchAuditLogs(1);
                fetchComplianceSummary();
              }}
              className="btn-clear"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="export-section">
        <div className="export-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={auditLogs && auditLogs.length > 0 && selectedLogs.length === auditLogs.length}
              onChange={handleSelectAll}
            />
            Select All ({selectedLogs?.length || 0} selected)
          </label>
          <button
            onClick={handleExportPDF}
            disabled={!selectedLogs || selectedLogs.length === 0}
            className="btn-export"
          >
            📄 Export PDF
          </button>
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
          <span>Loading audit logs...</span>
        </div>
      )}

      {/* Audit Table */}
      {!loading && (
        <div className="audit-table-container">
          <div className="table-header">
            <h3>Audit Records</h3>
            <span className="entry-count">{pagination.totalEntries} records</span>
          </div>
          
          <div className="table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Visit Type</th>
                  <th>Provider</th>
                  <th>Compliance Flags</th>
                  <th>Signature</th>
                  <th>SOAP Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="audit-row">
                      <td className="select-cell">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log._id)}
                          onChange={() => handleLogSelection(log._id)}
                        />
                      </td>
                      <td className="date-cell">
                        {formatDate(log.visitDate)}
                      </td>
                      <td className="patient-cell">
                        <div className="patient-info">
                          <div className="patient-name">
                            {log.patient?.firstName} {log.patient?.lastName}
                          </div>
                          <div className="patient-record">
                            #{log.patient?.recordNumber}
                          </div>
                        </div>
                      </td>
                      <td className="visit-type-cell">
                        <span className={`visit-badge ${log.visitType?.toLowerCase()}`}>
                          {log.visitType}
                        </span>
                      </td>
                      <td className="provider-cell">
                        {log.providerName}
                      </td>
                      <td className="compliance-cell">
                        <div className="compliance-flags">
                          <span className={getComplianceFlagClass(!log.complianceFlags?.missingSignature)}>
                            📝
                          </span>
                          <span className={getComplianceFlagClass(!log.complianceFlags?.missingNotes)}>
                            📋
                          </span>
                          <span className={getComplianceFlagClass(!log.complianceFlags?.copayOverride)}>
                            💰
                          </span>
                          <span className={getComplianceFlagClass(!log.complianceFlags?.incompleteSOAP)}>
                            🩺
                          </span>
                        </div>
                      </td>
                      <td className="signature-cell">
                        <span className={`signature-status ${log.signature?.isValid ? 'valid' : 'invalid'}`}>
                          {log.signature?.isValid ? '✅ Valid' : '❌ Invalid'}
                        </span>
                      </td>
                      <td className="soap-cell">
                        <span className={`soap-status ${log.soapNote?.isComplete ? 'complete' : 'incomplete'}`}>
                          {log.soapNote?.isComplete ? '✅ Complete' : '⚠️ Incomplete'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => fetchAuditDetails(log._id)}
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
                      No audit records found
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
      {showDetailModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content audit-detail-modal">
            <div className="modal-header">
              <h3>Audit Record Details</h3>
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
                    <span>{selectedLog.patientId?.firstName} {selectedLog.patientId?.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Record #:</label>
                    <span>#{selectedLog.patientId?.recordNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedLog.patientId?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedLog.patientId?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="detail-section">
                <h4>Visit Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{formatDate(selectedLog.visitDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedLog.visitType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Provider:</label>
                    <span>{selectedLog.providerName}</span>
                  </div>
                </div>
              </div>

              {/* SOAP Notes */}
              {selectedLog.soapNote && (
                <div className="detail-section">
                  <h4>SOAP Notes</h4>
                  <div className="soap-notes">
                    {selectedLog.soapNote.subjective && (
                      <div className="soap-section">
                        <h5>Subjective:</h5>
                        <p>{selectedLog.soapNote.subjective}</p>
                      </div>
                    )}
                    {selectedLog.soapNote.objective && (
                      <div className="soap-section">
                        <h5>Objective:</h5>
                        <p>{selectedLog.soapNote.objective}</p>
                      </div>
                    )}
                    {selectedLog.soapNote.assessment && (
                      <div className="soap-section">
                        <h5>Assessment:</h5>
                        <p>{selectedLog.soapNote.assessment}</p>
                      </div>
                    )}
                    {selectedLog.soapNote.plan && (
                      <div className="soap-section">
                        <h5>Plan:</h5>
                        <p>{selectedLog.soapNote.plan}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Billing and Diagnostic Codes */}
              <div className="detail-section">
                <h4>Billing & Diagnostic Codes</h4>
                <div className="codes-grid">
                  <div className="codes-column">
                    <h5>Billing Codes:</h5>
                    {selectedLog.billingCodes?.map((code, index) => (
                      <div key={index} className="code-item">
                        <span className="code-number">{code.code}</span>
                        <span className="code-description">{code.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="codes-column">
                    <h5>Diagnostic Codes:</h5>
                    {selectedLog.diagnosticCodes?.map((code, index) => (
                      <div key={index} className="code-item">
                        <span className="code-number">{code.code}</span>
                        <span className="code-description">{code.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compliance Flags */}
              <div className="detail-section">
                <h4>Compliance Status</h4>
                <div className="compliance-detail">
                  <div className={`compliance-item ${selectedLog.complianceFlags?.missingSignature ? 'error' : 'ok'}`}>
                    <span className="compliance-icon">📝</span>
                    <span>Digital Signature: {selectedLog.complianceFlags?.missingSignature ? 'Missing' : 'Present'}</span>
                  </div>
                  <div className={`compliance-item ${selectedLog.complianceFlags?.missingNotes ? 'error' : 'ok'}`}>
                    <span className="compliance-icon">📋</span>
                    <span>Visit Notes: {selectedLog.complianceFlags?.missingNotes ? 'Missing' : 'Present'}</span>
                  </div>
                  <div className={`compliance-item ${selectedLog.complianceFlags?.copayOverride ? 'warning' : 'ok'}`}>
                    <span className="compliance-icon">💰</span>
                    <span>Copay Override: {selectedLog.complianceFlags?.copayOverride ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={`compliance-item ${selectedLog.complianceFlags?.incompleteSOAP ? 'warning' : 'ok'}`}>
                    <span className="compliance-icon">🩺</span>
                    <span>SOAP Notes: {selectedLog.complianceFlags?.incompleteSOAP ? 'Incomplete' : 'Complete'}</span>
                  </div>
                  <div className={`compliance-item ${selectedLog.complianceFlags?.missingDiagnosis ? 'error' : 'ok'}`}>
                    <span className="compliance-icon">🔍</span>
                    <span>Diagnosis: {selectedLog.complianceFlags?.missingDiagnosis ? 'Missing' : 'Present'}</span>
                  </div>
                </div>
              </div>

              {/* Signature Information */}
              {selectedLog.signature && (
                <div className="detail-section">
                  <h4>Digital Signature</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Signed By:</label>
                      <span>{selectedLog.signature.signedBy}</span>
                    </div>
                    <div className="detail-item">
                      <label>Timestamp:</label>
                      <span>{new Date(selectedLog.signature.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`signature-status ${selectedLog.signature.isValid ? 'valid' : 'invalid'}`}>
                        {selectedLog.signature.isValid ? '✅ Valid' : '❌ Invalid'}
                      </span>
                    </div>
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

      {/* Patient Search Modal */}
      {showPatientSearch && (
        <div className="modal-overlay">
          <div className="modal-content patient-search-modal">
            <div className="modal-header">
              <h3>Select Patient for Audit Filter</h3>
              <button
                className="btn-close"
                onClick={() => setShowPatientSearch(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <PatientSearch
                token={token}
                onPatientSelect={handlePatientSelect}
                showCreateNew={false}
                placeholder="Search patients for audit filtering..."
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowPatientSearch(false)}
                className="btn-close-modal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
