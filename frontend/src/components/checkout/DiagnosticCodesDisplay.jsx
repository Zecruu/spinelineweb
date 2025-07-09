import './DiagnosticCodesDisplay.css';

const DiagnosticCodesDisplay = ({ diagnosticCodes, appointmentId, token }) => {
  
  const getCodeCategory = (code) => {
    if (code.startsWith('M99')) return 'Biomechanical Lesions';
    if (code.startsWith('M54')) return 'Dorsalgia';
    if (code.startsWith('M25')) return 'Joint Disorders';
    if (code.startsWith('M79')) return 'Soft Tissue Disorders';
    if (code.startsWith('S13')) return 'Cervical Spine Injuries';
    if (code.startsWith('S23')) return 'Thoracic Spine Injuries';
    if (code.startsWith('S33')) return 'Lumbar Spine Injuries';
    return 'Other';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Biomechanical Lesions': return '#3b82f6';
      case 'Dorsalgia': return '#ef4444';
      case 'Joint Disorders': return '#f59e0b';
      case 'Soft Tissue Disorders': return '#10b981';
      case 'Cervical Spine Injuries': return '#8b5cf6';
      case 'Thoracic Spine Injuries': return '#ec4899';
      case 'Lumbar Spine Injuries': return '#f97316';
      default: return '#6b7280';
    }
  };

  const formatCodeDescription = (description) => {
    // Capitalize first letter and ensure proper formatting
    return description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
  };

  const groupCodesByCategory = (codes) => {
    const grouped = {};
    codes.forEach(code => {
      const category = getCodeCategory(code.code);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(code);
    });
    return grouped;
  };

  const groupedCodes = groupCodesByCategory(diagnosticCodes);

  return (
    <div className="checkout-section">
      <h3>🧠 Diagnostic Codes</h3>
      
      <div className="diagnostic-codes-header">
        <p>Medical diagnostic codes for this visit (view-only)</p>
        <div className="codes-info">
          <span className="info-icon">ℹ️</span>
          <span>Used for medical necessity and billing compliance</span>
        </div>
      </div>

      <div className="diagnostic-codes-content">
        {diagnosticCodes.length === 0 ? (
          <div className="no-diagnostic-codes">
            <div className="no-codes-icon">🏥</div>
            <p>No diagnostic codes recorded for this visit</p>
            <small>Diagnostic codes are typically added by the doctor during the examination</small>
          </div>
        ) : (
          <div className="diagnostic-codes-list">
            {Object.entries(groupedCodes).map(([category, codes]) => (
              <div key={category} className="diagnostic-category">
                <div 
                  className="category-header"
                  style={{ borderLeftColor: getCategoryColor(category) }}
                >
                  <h4 style={{ color: getCategoryColor(category) }}>
                    {category}
                  </h4>
                  <span className="category-count">
                    {codes.length} code{codes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="category-codes">
                  {codes.map((code, index) => (
                    <div key={index} className="diagnostic-code-item">
                      <div className="code-main">
                        <span 
                          className="code-number"
                          style={{ backgroundColor: getCategoryColor(category) }}
                        >
                          {code.code}
                        </span>
                        <div className="code-details">
                          <div className="code-description">
                            {formatCodeDescription(code.description)}
                          </div>
                          {code.severity && (
                            <div className="code-severity">
                              Severity: <span className={`severity-${code.severity.toLowerCase()}`}>
                                {code.severity}
                              </span>
                            </div>
                          )}
                          {code.laterality && (
                            <div className="code-laterality">
                              Location: {code.laterality}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {code.notes && (
                        <div className="code-notes">
                          <strong>Clinical Notes:</strong> {code.notes}
                        </div>
                      )}
                      
                      <div className="code-metadata">
                        <span>Added: {new Date(code.dateAdded).toLocaleDateString()}</span>
                        {code.addedBy && (
                          <span>By: Dr. {code.addedBy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {diagnosticCodes.length > 0 && (
        <div className="diagnostic-codes-footer">
          <div className="medical-necessity-note">
            <h5>📋 Medical Necessity Documentation</h5>
            <p>
              These diagnostic codes establish medical necessity for the treatments provided 
              and are required for insurance billing and compliance audits.
            </p>
            <ul>
              <li>Codes support the medical justification for services rendered</li>
              <li>Required for insurance claim processing and reimbursement</li>
              <li>Used in compliance audits and quality assurance reviews</li>
              <li>Linked to treatment protocols and care plans</li>
            </ul>
          </div>
          
          <div className="codes-summary">
            <div className="summary-item">
              <span className="summary-label">Total Codes:</span>
              <span className="summary-value">{diagnosticCodes.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Categories:</span>
              <span className="summary-value">{Object.keys(groupedCodes).length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Primary Code:</span>
              <span className="summary-value">
                {diagnosticCodes[0]?.code || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticCodesDisplay;
