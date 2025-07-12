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
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load existing SOAP note and patient history on mount
  useEffect(() => {
    loadExistingSOAPNote();
    loadPatientHistory();
  }, [appointment._id, patient._id]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [soapData, spineSegments, isDirty]);

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
    { id: 'spine', label: 'Spine Listings', icon: '🦴' }
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
          {activeTab === 'spine' ? (
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
        <button className="btn-success">
          Complete & Sign
        </button>
      </div>
    </div>
  );
};

export default SOAPNoteInterface;
