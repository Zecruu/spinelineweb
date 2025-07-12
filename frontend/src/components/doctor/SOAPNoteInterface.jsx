import { useState, useEffect } from 'react';
import './SOAPNoteInterface.css';

const SOAPNoteInterface = ({ patient, appointment, onClose, onSave, token }) => {
  const [activeTab, setActiveTab] = useState('subjective');
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [spineSegments, setSpineSegments] = useState({});
  const [diagnosticCodes, setDiagnosticCodes] = useState([]);
  const [billingCodes, setBillingCodes] = useState([]);
  const [availableDiagnosticCodes, setAvailableDiagnosticCodes] = useState([]);
  const [availableBillingCodes, setAvailableBillingCodes] = useState([]);
  const [isReadyToSign, setIsReadyToSign] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSigned, setIsSigned] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load existing SOAP note and patient history on mount
  useEffect(() => {
    loadExistingSOAPNote();
    loadPatientHistory();
    loadAvailableCodes();
    updatePatientStatus('in-progress');
  }, [appointment._id, patient._id]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [soapData, spineSegments, diagnosticCodes, billingCodes, isDirty]);

  const loadExistingSOAPNote = async () => {
    try {
      const response = await fetch(`/api/soap-notes/appointment/${appointment._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const existingNote = await response.json();
        setSoapData({
          subjective: existingNote.subjective?.historyOfPresentIllness || '',
          objective: existingNote.objective?.physicalExam || '',
          assessment: existingNote.assessment?.clinicalImpression || '',
          plan: existingNote.plan?.treatmentPlan || ''
        });
        setSpineSegments(existingNote.spineSegments || {});
        setDiagnosticCodes(existingNote.diagnosticCodes || []);
        setBillingCodes(existingNote.billingCodes || []);
      }
    } catch (error) {
      console.error('Error loading existing SOAP note:', error);
    }
  };

  const loadPatientHistory = async () => {
    try {
      const response = await fetch(`/api/soap-notes/patient-history/${patient._id}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setPatientHistory(history);
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
    }
  };

  const loadAvailableCodes = async () => {
    try {
      // Load diagnostic codes
      const diagnosticResponse = await fetch('/api/diagnostic-codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (diagnosticResponse.ok) {
        const diagnosticData = await diagnosticResponse.json();
        setAvailableDiagnosticCodes(diagnosticData);
      }

      // Load billing codes
      const billingResponse = await fetch('/api/billing-codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setAvailableBillingCodes(billingData);
      }
    } catch (error) {
      console.error('Error loading available codes:', error);
    }
  };

  const updatePatientStatus = async (status) => {
    try {
      await fetch(`/api/appointments/${appointment._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
  };

  const handleAutoSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/soap-notes/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: appointment._id,
          patientId: patient._id,
          soapData,
          spineSegments,
          diagnosticCodes,
          billingCodes,
          status: 'in-progress'
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoapChange = (section, value) => {
    setSoapData(prev => ({
      ...prev,
      [section]: value
    }));
    setIsDirty(true);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPatientInitials = (firstName, lastName) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(lastName.length - 1)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

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

  const tabs = [
    { id: 'subjective', label: 'Subjective', icon: '🗣️' },
    { id: 'objective', label: 'Objective', icon: '🔍' },
    { id: 'assessment', label: 'Assessment', icon: '📊' },
    { id: 'plan', label: 'Plan', icon: '📋' },
    { id: 'spine', label: 'Spine Listings', icon: '🦴' },
    { id: 'codes', label: 'Diagnosis & Billing', icon: '🏥' },
    { id: 'signature', label: 'Sign & Complete', icon: '✍️' }
  ];

  const spineSegmentsList = [
    { group: 'Cervical', segments: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] },
    { group: 'Thoracic', segments: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'] },
    { group: 'Lumbar', segments: ['L1', 'L2', 'L3', 'L4', 'L5'] }
  ];

  const handleSpineSegmentChange = (segment, field, value) => {
    setSpineSegments(prev => ({
      ...prev,
      [segment]: {
        ...prev[segment],
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const addDiagnosticCode = (code) => {
    if (!diagnosticCodes.find(dc => dc.code === code.code)) {
      setDiagnosticCodes(prev => [...prev, { ...code, id: Date.now() }]);
      setIsDirty(true);
    }
  };

  const removeDiagnosticCode = (id) => {
    setDiagnosticCodes(prev => prev.filter(dc => dc.id !== id));
    setIsDirty(true);
  };

  const addBillingCode = (code) => {
    if (!billingCodes.find(bc => bc.code === code.code)) {
      setBillingCodes(prev => [...prev, { ...code, id: Date.now(), units: 1 }]);
      setIsDirty(true);
    }
  };

  const removeBillingCode = (id) => {
    setBillingCodes(prev => prev.filter(bc => bc.id !== id));
    setIsDirty(true);
  };

  const updateBillingCodeUnits = (id, units) => {
    setBillingCodes(prev => prev.map(bc =>
      bc.id === id ? { ...bc, units: parseInt(units) || 1 } : bc
    ));
    setIsDirty(true);
  };

  // Check if note is ready to sign
  useEffect(() => {
    const hasContent = soapData.subjective || soapData.objective || soapData.assessment || soapData.plan;
    const hasCodes = diagnosticCodes.length > 0 || billingCodes.length > 0;
    setIsReadyToSign(hasContent && hasCodes);
  }, [soapData, diagnosticCodes, billingCodes]);

  const handleSignNote = async () => {
    if (!isReadyToSign) {
      alert('Please complete the SOAP note and add at least one diagnostic or billing code before signing.');
      return;
    }

    try {
      // Create a simple text signature for now (in production, this would be a digital signature pad)
      const signature = `${patient.firstName} ${patient.lastName} - ${new Date().toLocaleString()} - Dr. ${user.firstName} ${user.lastName}`;

      const response = await fetch(`/api/soap-notes/sign/${appointment._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          signatureData: signature,
          soapData,
          spineSegments,
          diagnosticCodes,
          billingCodes
        })
      });

      if (response.ok) {
        setIsSigned(true);
        setSignatureData(signature);
        alert('SOAP note signed successfully! Patient has been moved to checked-out status.');
        onClose(); // Close the interface and refresh the dashboard
      } else {
        const error = await response.json();
        alert(`Error signing note: ${error.message}`);
      }
    } catch (error) {
      console.error('Error signing SOAP note:', error);
      alert('Error signing SOAP note. Please try again.');
    }
  };

  return (
    <div className="soap-note-interface">
      {/* Sticky Header */}
      <div className="soap-header">
        {/* Left: Insurance Info */}
        <div className="insurance-section">
          <div className="insurance-info">
            <h4>Insurance Coverage</h4>
            <div className="coverage-details">
              <span className="insurance-name">
                {patient.insurance?.primary?.name || 'Self Pay'}
              </span>
              {patient.insurance?.primary?.copay && (
                <span className="copay-info">
                  Copay: ${patient.insurance.primary.copay}
                </span>
              )}
            </div>
            <div className="covered-codes">
              <small>Covered: CPT 98941, 98942, 98943</small>
            </div>
          </div>
        </div>

        {/* Center: Patient Info */}
        <div className="patient-section">
          <div className="patient-avatar-large">
            <div className="avatar-circle-large">
              {getPatientInitials(patient.firstName, patient.lastName)}
            </div>
          </div>
          <div className="patient-details-main">
            <h2 className="patient-name-large">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="patient-meta">
              <span className="dob">DOB: {new Date(patient.dob).toLocaleDateString()}</span>
              <span className="age">Age: {calculateAge(patient.dob)}</span>
              <span className="record">#{patient.recordNumber}</span>
            </div>
            <div className="visit-info">
              <span className="visit-type">{appointment.visitType || 'Standard Visit'}</span>
              <span className="visit-time">{formatTime(appointment.time)}</span>
            </div>
          </div>
        </div>

        {/* Right: History Toggle */}
        <div className="history-section">
          <button 
            className={`history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            📚 Patient History
          </button>
          {lastSaved && (
            <div className="save-status">
              <span className="save-indicator">
                {loading ? '💾 Saving...' : '✅ Saved'}
              </span>
              <small>Last saved: {lastSaved.toLocaleTimeString()}</small>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible History Panel */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-content">
            <h3>Previous Visits</h3>
            <div className="history-list">
              {patientHistory.length === 0 ? (
                <p className="no-history">No previous visits found</p>
              ) : (
                patientHistory.map((visit, index) => (
                  <div key={index} className="history-item">
                    <div className="visit-date">{visit.date}</div>
                    <div className="visit-summary">{visit.summary}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="soap-content">
        {/* Navigation Tabs */}
        <div className="soap-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'codes' ? (
            <div className="codes-section">
              <h3>Diagnosis & Billing Codes</h3>

              {/* Diagnostic Codes */}
              <div className="codes-group">
                <h4>Diagnostic Codes (ICD-10)</h4>
                <div className="codes-list">
                  {diagnosticCodes.map(code => (
                    <div key={code.id} className="code-item diagnostic">
                      <div className="code-info">
                        <span className="code-number">{code.code}</span>
                        <span className="code-description">{code.description}</span>
                      </div>
                      <button
                        className="remove-code-btn"
                        onClick={() => removeDiagnosticCode(code.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="add-code-section">
                  <input
                    type="text"
                    className="code-search"
                    placeholder="Search diagnostic codes..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const searchTerm = e.target.value.toLowerCase();
                        const foundCode = availableDiagnosticCodes.find(code =>
                          code.code.toLowerCase().includes(searchTerm) ||
                          code.description.toLowerCase().includes(searchTerm)
                        );
                        if (foundCode) {
                          addDiagnosticCode(foundCode);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    className="add-code-btn"
                    onClick={() => {
                      const input = document.querySelector('.code-search');
                      const searchTerm = input.value.toLowerCase();
                      const foundCode = availableDiagnosticCodes.find(code =>
                        code.code.toLowerCase().includes(searchTerm) ||
                        code.description.toLowerCase().includes(searchTerm)
                      );
                      if (foundCode) {
                        addDiagnosticCode(foundCode);
                        input.value = '';
                      }
                    }}
                  >
                    Add Code
                  </button>
                </div>

                {/* Quick Add Common Diagnostic Codes */}
                <div className="quick-codes">
                  <h5>Common Codes:</h5>
                  <div className="quick-code-buttons">
                    <button
                      className="quick-code-btn"
                      onClick={() => addDiagnosticCode({code: 'M54.5', description: 'Low back pain'})}
                    >
                      M54.5 - Low back pain
                    </button>
                    <button
                      className="quick-code-btn"
                      onClick={() => addDiagnosticCode({code: 'M54.2', description: 'Cervicalgia'})}
                    >
                      M54.2 - Cervicalgia
                    </button>
                    <button
                      className="quick-code-btn"
                      onClick={() => addDiagnosticCode({code: 'M25.50', description: 'Pain in unspecified joint'})}
                    >
                      M25.50 - Joint pain
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing Codes */}
              <div className="codes-group">
                <h4>Billing Codes (CPT)</h4>
                <div className="codes-list">
                  {billingCodes.map(code => (
                    <div key={code.id} className="code-item billing">
                      <div className="code-info">
                        <span className="code-number">{code.code}</span>
                        <span className="code-description">{code.description}</span>
                      </div>
                      <div className="code-units">
                        <label>Units:</label>
                        <input
                          type="number"
                          min="1"
                          value={code.units}
                          onChange={(e) => updateBillingCodeUnits(code.id, e.target.value)}
                          className="units-input"
                        />
                      </div>
                      <button
                        className="remove-code-btn"
                        onClick={() => removeBillingCode(code.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="add-code-section">
                  <input
                    type="text"
                    className="code-search billing-search"
                    placeholder="Search billing codes..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const searchTerm = e.target.value.toLowerCase();
                        const foundCode = availableBillingCodes.find(code =>
                          code.code.toLowerCase().includes(searchTerm) ||
                          code.description.toLowerCase().includes(searchTerm)
                        );
                        if (foundCode) {
                          addBillingCode(foundCode);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    className="add-code-btn"
                    onClick={() => {
                      const input = document.querySelector('.billing-search');
                      const searchTerm = input.value.toLowerCase();
                      const foundCode = availableBillingCodes.find(code =>
                        code.code.toLowerCase().includes(searchTerm) ||
                        code.description.toLowerCase().includes(searchTerm)
                      );
                      if (foundCode) {
                        addBillingCode(foundCode);
                        input.value = '';
                      }
                    }}
                  >
                    Add Code
                  </button>
                </div>

                {/* Quick Add Common Billing Codes */}
                <div className="quick-codes">
                  <h5>Common Codes:</h5>
                  <div className="quick-code-buttons">
                    <button
                      className="quick-code-btn"
                      onClick={() => addBillingCode({code: '98940', description: 'Chiropractic manipulative treatment; spinal, 1-2 regions'})}
                    >
                      98940 - CMT 1-2 regions
                    </button>
                    <button
                      className="quick-code-btn"
                      onClick={() => addBillingCode({code: '98941', description: 'Chiropractic manipulative treatment; spinal, 3-4 regions'})}
                    >
                      98941 - CMT 3-4 regions
                    </button>
                    <button
                      className="quick-code-btn"
                      onClick={() => addBillingCode({code: '98942', description: 'Chiropractic manipulative treatment; spinal, 5 regions'})}
                    >
                      98942 - CMT 5 regions
                    </button>
                    <button
                      className="quick-code-btn"
                      onClick={() => addBillingCode({code: '97140', description: 'Manual therapy techniques'})}
                    >
                      97140 - Manual therapy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'spine' ? (
            <div className="spine-section">
              <h3>Spine Segment Documentation</h3>
              <div className="spine-groups">
                {spineSegmentsList.map(group => (
                  <div key={group.group} className="spine-group">
                    <h4 className="spine-group-title">{group.group} Spine</h4>
                    <div className="spine-segments">
                      {group.segments.map(segment => (
                        <div key={segment} className="spine-segment">
                          <div className="segment-header">
                            <span className="segment-label">{segment}</span>
                          </div>
                          <div className="segment-inputs">
                            <div className="input-group">
                              <label>Findings:</label>
                              <input
                                type="text"
                                className="segment-input"
                                value={spineSegments[segment]?.findings || ''}
                                onChange={(e) => handleSpineSegmentChange(segment, 'findings', e.target.value)}
                                placeholder="Enter findings..."
                              />
                            </div>
                            <div className="input-group">
                              <label>Treatment:</label>
                              <input
                                type="text"
                                className="segment-input"
                                value={spineSegments[segment]?.treatment || ''}
                                onChange={(e) => handleSpineSegmentChange(segment, 'treatment', e.target.value)}
                                placeholder="Enter treatment..."
                              />
                            </div>
                            <div className="input-group">
                              <label>Notes:</label>
                              <input
                                type="text"
                                className="segment-input"
                                value={spineSegments[segment]?.notes || ''}
                                onChange={(e) => handleSpineSegmentChange(segment, 'notes', e.target.value)}
                                placeholder="Additional notes..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'signature' ? (
            <div className="signature-section">
              <h3>Complete & Sign SOAP Note</h3>

              {/* Completion Checklist */}
              <div className="completion-checklist">
                <h4>Documentation Checklist</h4>
                <div className="checklist-items">
                  <div className={`checklist-item ${soapData.subjective ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{soapData.subjective ? '✅' : '❌'}</span>
                    <span>Subjective Notes</span>
                  </div>
                  <div className={`checklist-item ${soapData.objective ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{soapData.objective ? '✅' : '❌'}</span>
                    <span>Objective Findings</span>
                  </div>
                  <div className={`checklist-item ${soapData.assessment ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{soapData.assessment ? '✅' : '❌'}</span>
                    <span>Assessment</span>
                  </div>
                  <div className={`checklist-item ${soapData.plan ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{soapData.plan ? '✅' : '❌'}</span>
                    <span>Treatment Plan</span>
                  </div>
                  <div className={`checklist-item ${diagnosticCodes.length > 0 ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{diagnosticCodes.length > 0 ? '✅' : '❌'}</span>
                    <span>Diagnostic Codes ({diagnosticCodes.length})</span>
                  </div>
                  <div className={`checklist-item ${billingCodes.length > 0 ? 'complete' : 'incomplete'}`}>
                    <span className="check-icon">{billingCodes.length > 0 ? '✅' : '❌'}</span>
                    <span>Billing Codes ({billingCodes.length})</span>
                  </div>
                </div>
              </div>

              {/* Signature Area */}
              <div className="signature-area">
                <h4>Digital Signature</h4>
                {isSigned ? (
                  <div className="signed-note">
                    <div className="signature-display">
                      <span className="signature-text">{signatureData}</span>
                      <span className="signature-status">✅ Signed & Locked</span>
                    </div>
                  </div>
                ) : (
                  <div className="signature-form">
                    <div className="signature-info">
                      <p>By clicking "Sign Note", you confirm that:</p>
                      <ul>
                        <li>All documentation is accurate and complete</li>
                        <li>Treatment provided matches the documented services</li>
                        <li>This note will be locked and cannot be modified</li>
                        <li>Patient will be moved to checked-out status</li>
                      </ul>
                    </div>
                    <button
                      className={`sign-button ${isReadyToSign ? 'ready' : 'disabled'}`}
                      onClick={handleSignNote}
                      disabled={!isReadyToSign}
                    >
                      {isReadyToSign ? '✍️ Sign Note' : '⚠️ Complete Required Fields'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="soap-section">
              <h3>{tabs.find(t => t.id === activeTab)?.label} Notes</h3>
              <textarea
                className="soap-textarea"
                value={soapData[activeTab]}
                onChange={(e) => handleSoapChange(activeTab, e.target.value)}
                placeholder={`Enter ${activeTab} information...`}
                rows={15}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="soap-actions">
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
        <button className="btn-primary" onClick={() => handleAutoSave()}>
          Save Progress
        </button>
        {isSigned ? (
          <button className="btn-success" disabled>
            ✅ Signed & Complete
          </button>
        ) : (
          <button
            className={`btn-success ${isReadyToSign ? '' : 'disabled'}`}
            onClick={handleSignNote}
            disabled={!isReadyToSign}
          >
            ✍️ Complete & Sign
          </button>
        )}
      </div>
    </div>
  );
};

export default SOAPNoteInterface;
