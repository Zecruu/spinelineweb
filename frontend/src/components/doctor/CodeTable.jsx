import React, { useState } from 'react';
import './CodeTable.css';

const CodeTable = ({ 
  codes, 
  availableCodes, 
  onAddCode, 
  onRemoveCode, 
  type, // 'diagnostic' or 'billing'
  title 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Filter available codes based on search
  const filteredAvailableCodes = availableCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate available codes
  const totalPages = Math.ceil(filteredAvailableCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredAvailableCodes.slice(startIndex, startIndex + itemsPerPage);

  const handleAddCode = (code) => {
    // Check if code is already added
    const isAlreadyAdded = codes.some(existingCode => existingCode.code === code.code);
    if (!isAlreadyAdded) {
      onAddCode(code);
    }
  };

  const isCodeAdded = (code) => {
    return codes.some(existingCode => existingCode.code === code.code);
  };

  return (
    <div className="code-table-container">
      {/* Added Codes Section */}
      {codes.length > 0 && (
        <div className="added-codes-section">
          <h4 className="section-title">Added {title}</h4>
          <div className="added-codes-table">
            <div className="table-header">
              <div className="header-cell code-col">Code</div>
              <div className="header-cell description-col">Description</div>
              <div className="header-cell action-col">Action</div>
            </div>
            <div className="table-body">
              {codes.map((code) => (
                <div key={code.id || code.code} className="table-row added-row">
                  <div className="table-cell code-col">
                    <span className="code-number added">{code.code}</span>
                  </div>
                  <div className="table-cell description-col">
                    <span className="code-description">{code.description}</span>
                  </div>
                  <div className="table-cell action-col">
                    <button
                      className="remove-code-btn"
                      onClick={() => onRemoveCode(code.id || code.code)}
                      title="Remove code"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Codes Section */}
      <div className="available-codes-section">
        <div className="section-header">
          <h4 className="section-title">Add {title}</h4>
          <div className="search-controls">
            <input
              type="text"
              className="code-search-input"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <div className="pagination-info">
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>
        </div>

        <div className="available-codes-table">
          <div className="table-header">
            <div className="header-cell action-col">Action</div>
            <div className="header-cell code-col">Code</div>
            <div className="header-cell description-col">Description</div>
          </div>
          <div className="table-body">
            {paginatedCodes.map((code, index) => (
              <div key={`${code.code}-${index}`} className="table-row available-row">
                <div className="table-cell action-col">
                  <button
                    className={`add-code-btn ${isCodeAdded(code) ? 'added' : ''}`}
                    onClick={() => handleAddCode(code)}
                    disabled={isCodeAdded(code)}
                  >
                    {isCodeAdded(code) ? 'Added' : `Add ${type === 'diagnostic' ? 'Diagnosis' : 'Code'}`}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTable;
