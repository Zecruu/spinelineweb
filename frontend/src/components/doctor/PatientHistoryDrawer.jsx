import { useState, useEffect } from 'react';
import './PatientHistoryDrawer.css';

const PatientHistoryDrawer = ({ patientId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'recent', 'signed', 'unsigned'

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPatientHistory();
  }, [patientId]);

  const fetchPatientHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctor/patient-history/${patientId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data.history || []);
      } else {
        console.error('Failed to fetch patient history');
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    switch (filter) {
      case 'recent':
        return history.slice(0, 10);
      case 'signed':
        return history.filter(visit => visit.soapNote?.isSigned);
      case 'unsigned':
        return history.filter(visit => visit.soapNote && !visit.soapNote.isSigned);
      default:
        return history;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPainScaleColor = (painScale) => {
    if (painScale === null || painScale === undefined) return '#6b7280';
    if (painScale <= 3) return '#10b981';
    if (painScale <= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getVisitStatusColor = (visit) => {
    if (!visit.soapNote) return '#6b7280';
    if (visit.soapNote.isSigned) return '#10b981';
    return '#f59e0b';
  };

  const getVisitStatusText = (visit) => {
    if (!visit.soapNote) return 'No Documentation';
    if (visit.soapNote.isSigned) return 'Complete';
    return 'Incomplete';
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="history-drawer-overlay">
      <div className="history-drawer">
        <div className="drawer-header">
          <h2>📊 Patient History</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-filters">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Visits ({history.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
              onClick={() => setFilter('recent')}
            >
              Recent (10)
            </button>
            <button 
              className={`filter-btn ${filter === 'signed' ? 'active' : ''}`}
              onClick={() => setFilter('signed')}
            >
              Complete ({history.filter(v => v.soapNote?.isSigned).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unsigned' ? 'active' : ''}`}
              onClick={() => setFilter('unsigned')}
            >
              Incomplete ({history.filter(v => v.soapNote && !v.soapNote.isSigned).length})
            </button>
          </div>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading patient history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No visits found</p>
              <small>Patient history will appear here once visits are documented</small>
            </div>
          ) : (
            <div className="history-timeline">
              {filteredHistory.map((visit, index) => (
                <div 
                  key={visit._id} 
                  className={`timeline-item ${selectedVisit?._id === visit._id ? 'selected' : ''}`}
                  onClick={() => setSelectedVisit(selectedVisit?._id === visit._id ? null : visit)}
                >
                  <div className="timeline-marker">
                    <div 
                      className="marker-dot"
                      style={{ backgroundColor: getVisitStatusColor(visit) }}
                    ></div>
                    {index < filteredHistory.length - 1 && <div className="marker-line"></div>}
                  </div>

                  <div className="timeline-content">
                    <div className="visit-header">
                      <div className="visit-date-time">
                        <span className="visit-date">{formatDate(visit.appointmentDate)}</span>
                        <span className="visit-time">{formatTime(visit.appointmentTime)}</span>
                      </div>
                      
                      <div className="visit-meta">
                        <span className="visit-type">{visit.visitType || 'Standard'}</span>
                        <span 
                          className="visit-status"
                          style={{ color: getVisitStatusColor(visit) }}
                        >
                          {getVisitStatusText(visit)}
                        </span>
                      </div>
                    </div>

                    <div className="visit-summary">
                      <div className="provider-info">
                        <span className="provider-label">Provider:</span>
                        <span className="provider-name">
                          {visit.provider?.name || 'Unknown'}
                        </span>
                      </div>

                      {visit.soapNote?.painScale !== null && visit.soapNote?.painScale !== undefined && (
                        <div className="pain-scale">
                          <span className="pain-label">Pain Scale:</span>
                          <span 
                            className="pain-value"
                            style={{ color: getPainScaleColor(visit.soapNote.painScale) }}
                          >
                            {visit.soapNote.painScale}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedVisit?._id === visit._id && visit.soapNote && (
                      <div className="visit-details">
                        <div className="soap-sections">
                          {visit.soapNote.subjective?.chiefComplaint && (
                            <div className="soap-section">
                              <h4>Chief Complaint</h4>
                              <p>{visit.soapNote.subjective.chiefComplaint}</p>
                            </div>
                          )}

                          {visit.soapNote.assessment?.primaryDiagnosis?.description && (
                            <div className="soap-section">
                              <h4>Primary Diagnosis</h4>
                              <p>
                                {visit.soapNote.assessment.primaryDiagnosis.code && (
                                  <span className="diagnosis-code">
                                    {visit.soapNote.assessment.primaryDiagnosis.code}:
                                  </span>
                                )}
                                {visit.soapNote.assessment.primaryDiagnosis.description}
                              </p>
                            </div>
                          )}

                          {visit.soapNote.plan?.procedures && visit.soapNote.plan.procedures.length > 0 && (
                            <div className="soap-section">
                              <h4>Procedures</h4>
                              <div className="procedures-list">
                                {visit.soapNote.plan.procedures.map((proc, idx) => (
                                  <span key={idx} className="procedure-code">
                                    {proc.code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {visit.soapNote.plan?.treatmentPlan && (
                            <div className="soap-section">
                              <h4>Treatment Plan</h4>
                              <p>{visit.soapNote.plan.treatmentPlan}</p>
                            </div>
                          )}
                        </div>

                        <div className="visit-metadata">
                          <div className="metadata-item">
                            <span className="label">Created:</span>
                            <span className="value">
                              {new Date(visit.soapNote.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {visit.soapNote.isSigned && (
                            <div className="metadata-item">
                              <span className="label">Signed:</span>
                              <span className="value">
                                {visit.soapNote.signedAt ? 
                                  new Date(visit.soapNote.signedAt).toLocaleDateString() : 
                                  'Yes'
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryDrawer;
