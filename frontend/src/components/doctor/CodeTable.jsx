import React, { useState } from 'react';
import './CodeTable.css';

const DiagnosisAndBillingCodes = ({
  diagnosticCodes,
  billingCodes,
  availableDiagnosticCodes,
  availableBillingCodes,
  onAddDiagnosticCode,
  onRemoveDiagnosticCode,
  onAddBillingCode,
  onRemoveBillingCode
}) => {
  const [diagnosticPage, setDiagnosticPage] = useState(1);
  const [billingPage, setBillingPage] = useState(1);
  const [diagnosticSearch, setDiagnosticSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const itemsPerPage = 4;

  // Filter available codes based on search
  const filteredDiagnosticCodes = availableDiagnosticCodes.filter(code =>
    code.code.toLowerCase().includes(diagnosticSearch.toLowerCase()) ||
    code.description.toLowerCase().includes(diagnosticSearch.toLowerCase())
  );

  const filteredBillingCodes = availableBillingCodes.filter(code =>
    code.code.toLowerCase().includes(billingSearch.toLowerCase()) ||
    code.description.toLowerCase().includes(billingSearch.toLowerCase())
  );

  // Paginate available codes
  const diagnosticTotalPages = Math.ceil(filteredDiagnosticCodes.length / itemsPerPage);
  const diagnosticStartIndex = (diagnosticPage - 1) * itemsPerPage;
  const paginatedDiagnosticCodes = filteredDiagnosticCodes.slice(diagnosticStartIndex, diagnosticStartIndex + itemsPerPage);

  const billingTotalPages = Math.ceil(filteredBillingCodes.length / itemsPerPage);
  const billingStartIndex = (billingPage - 1) * itemsPerPage;
  const paginatedBillingCodes = filteredBillingCodes.slice(billingStartIndex, billingStartIndex + itemsPerPage);

  const handleAddDiagnosticCode = (code) => {
    const isAlreadyAdded = diagnosticCodes.some(existingCode => existingCode.code === code.code);
    if (!isAlreadyAdded) {
      onAddDiagnosticCode(code);
    }
  };

  const handleAddBillingCode = (code) => {
    const isAlreadyAdded = billingCodes.some(existingCode => existingCode.code === code.code);
    if (!isAlreadyAdded) {
      onAddBillingCode(code);
    }
  };

  const isDiagnosticCodeAdded = (code) => {
    return diagnosticCodes.some(existingCode => existingCode.code === code.code);
  };

  const isBillingCodeAdded = (code) => {
    return billingCodes.some(existingCode => existingCode.code === code.code);
  };

  return (
    <div className="diagnosis-billing-container">
      <div className="codes-header">
        <h2>Diagnosis & Billing Codes</h2>
      </div>

      {/* Added Codes Section - Top Row */}
      <div className="added-codes-row">
        {/* Added Diagnostic Codes */}
        <div className="added-codes-section diagnostic">
          <h3 className="section-title">Added Diagnostic Codes (ICD-10)</h3>
          <div className="added-codes-table">
            <div className="table-header">
              <div className="header-cell code-col">CODE</div>
              <div className="header-cell description-col">DESCRIPTION</div>
              <div className="header-cell action-col">ACTION</div>
            </div>
            <div className="table-body">
              {diagnosticCodes.length === 0 ? (
                <div className="empty-state">
                  <p>No diagnostic codes added yet</p>
                </div>
              ) : (
                diagnosticCodes.map((code) => (
                  <div key={code.id || code.code} className="table-row added-row">
                    <div className="table-cell code-col">
                      <span className="code-number diagnostic">{code.code}</span>
                    </div>
                    <div className="table-cell description-col">
                      <span className="code-description">{code.description}</span>
                    </div>
                    <div className="table-cell action-col">
                      <button
                        className="remove-code-btn"
                        onClick={() => onRemoveDiagnosticCode(code.id || code.code)}
                        title="Remove code"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Added Billing Codes */}
        <div className="added-codes-section billing">
          <h3 className="section-title">Added Billing Codes (CPT)</h3>
          <div className="added-codes-table">
            <div className="table-header">
              <div className="header-cell code-col">CODE</div>
              <div className="header-cell description-col">DESCRIPTION</div>
              <div className="header-cell action-col">ACTION</div>
            </div>
            <div className="table-body">
              {billingCodes.length === 0 ? (
                <div className="empty-state">
                  <p>No billing codes added yet</p>
                </div>
              ) : (
                billingCodes.map((code) => (
                  <div key={code.id || code.code} className="table-row added-row">
                    <div className="table-cell code-col">
                      <span className="code-number billing">{code.code}</span>
                    </div>
                    <div className="table-cell description-col">
                      <span className="code-description">{code.description}</span>
                    </div>
                    <div className="table-cell action-col">
                      <button
                        className="remove-code-btn"
                        onClick={() => onRemoveBillingCode(code.id || code.code)}
                        title="Remove code"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Codes Section - Bottom Row */}
      <div className="available-codes-row">
        {/* Add Diagnostic Codes */}
        <div className="available-codes-section diagnostic">
          <div className="section-header">
            <h3 className="section-title">Add Diagnostic Codes (ICD-10)</h3>
            <div className="search-controls">
              <input
                type="text"
                className="code-search-input"
                placeholder="Search diagnostic codes..."
                value={diagnosticSearch}
                onChange={(e) => {
                  setDiagnosticSearch(e.target.value);
                  setDiagnosticPage(1);
                }}
              />
              <div className="pagination-info">
                Page {diagnosticPage} of {diagnosticTotalPages || 1}
              </div>
            </div>
          </div>

          <div className="available-codes-table">
            <div className="table-header">
              <div className="header-cell action-col">ACTION</div>
              <div className="header-cell code-col">CODE</div>
              <div className="header-cell description-col">DESCRIPTION</div>
            </div>
            <div className="table-body">
              {paginatedDiagnosticCodes.map((code, index) => (
                <div key={`${code.code}-${index}`} className="table-row available-row">
                  <div className="table-cell action-col">
                    <button
                      className={`add-code-btn ${isDiagnosticCodeAdded(code) ? 'added' : ''}`}
                      onClick={() => handleAddDiagnosticCode(code)}
                      disabled={isDiagnosticCodeAdded(code)}
                    >
                      {isDiagnosticCodeAdded(code) ? 'Added' : 'Add Code'}
                    </button>
                  </div>
                  <div className="table-cell code-col">
                    <span className="code-number">{code.code}</span>
                  </div>
                  <div className="table-cell description-col">
                    <span className="code-description">{code.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Codes Pagination */}
          {diagnosticTotalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setDiagnosticPage(prev => Math.max(1, prev - 1))}
                disabled={diagnosticPage === 1}
              >
                ‹
              </button>

              <span className="pagination-current">{diagnosticPage}</span>
              <span className="pagination-total">{diagnosticTotalPages}</span>

              <button
                className="pagination-btn"
                onClick={() => setDiagnosticPage(prev => Math.min(diagnosticTotalPages, prev + 1))}
                disabled={diagnosticPage === diagnosticTotalPages}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Add Billing Codes */}
        <div className="available-codes-section billing">
          <div className="section-header">
            <h3 className="section-title">Add Billing Codes (CPT)</h3>
            <div className="search-controls">
              <input
                type="text"
                className="code-search-input"
                placeholder="Search billing codes..."
                value={billingSearch}
                onChange={(e) => {
                  setBillingSearch(e.target.value);
                  setBillingPage(1);
                }}
              />
              <div className="pagination-info">
                Page {billingPage} of {billingTotalPages || 1}
              </div>
            </div>
          </div>

          <div className="available-codes-table">
            <div className="table-header">
              <div className="header-cell action-col">ACTION</div>
              <div className="header-cell code-col">CODE</div>
              <div className="header-cell description-col">DESCRIPTION</div>
            </div>
            <div className="table-body">
              {paginatedBillingCodes.map((code, index) => (
                <div key={`${code.code}-${index}`} className="table-row available-row">
                  <div className="table-cell action-col">
                    <button
                      className={`add-code-btn ${isBillingCodeAdded(code) ? 'added' : ''}`}
                      onClick={() => handleAddBillingCode(code)}
                      disabled={isBillingCodeAdded(code)}
                    >
                      {isBillingCodeAdded(code) ? 'Added' : 'Add Code'}
                    </button>
                  </div>
                  <div className="table-cell code-col">
                    <span className="code-number">{code.code}</span>
                  </div>
                  <div className="table-cell description-col">
                    <span className="code-description">{code.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Codes Pagination */}
          {billingTotalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setBillingPage(prev => Math.max(1, prev - 1))}
                disabled={billingPage === 1}
              >
                ‹
              </button>

              <span className="pagination-current">{billingPage}</span>
              <span className="pagination-total">{billingTotalPages}</span>

              <button
                className="pagination-btn"
                onClick={() => setBillingPage(prev => Math.min(billingTotalPages, prev + 1))}
                disabled={billingPage === billingTotalPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DiagnosisAndBillingCodes;
