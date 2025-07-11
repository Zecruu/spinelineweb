import { useState } from 'react';
import './CheckedOutPatients.css';

const CheckedOutPatients = ({ patients, onPatientAction, selectedDate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getVisitTypeColor = (visitType) => {
    const colors = {
      'Chiropractic': '#10b981',
      'Decompression': '#3b82f6',
      'Matrix': '#8b5cf6',
      'New Patient': '#f59e0b',
      'Follow-up': '#06b6d4',
      'Consultation': '#ef4444'
    };
    return colors[visitType] || '#6b7280';
  };

  const getReviewStatus = (patient) => {
    if (!patient.soapNote || !patient.soapNote.isSigned) {
      return {
        status: 'needs-review',
        label: 'Note Incomplete',
        color: '#f59e0b',
        icon: '⚠️'
      };
    }
    
    if (patient.needsReview) {
      return {
        status: 'needs-review',
        label: 'Needs Review',
        color: '#f59e0b',
        icon: '👁️'
      };
    }
    
    return {
      status: 'complete',
      label: 'Complete',
      color: '#10b981',
      icon: '✅'
    };
  };

  const needsReviewCount = patients?.filter(p => {
    const reviewStatus = getReviewStatus(p);
    return reviewStatus.status === 'needs-review';
  }).length || 0;

  if (!patients || patients.length === 0) {
    return (
      <div className="patient-table-section checked-out">
        <div className="section-header">
          <h2>📤 Checked Out Patients</h2>
          <span className="patient-count">0 patients</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No patients checked out for {new Date(selectedDate).toLocaleDateString()}</p>
          <small>Completed visits will appear here for documentation review</small>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-table-section checked-out">
      <div className="section-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>📤 Checked Out Patients</h2>
        <div className="header-controls">
          <span className="patient-count">
            {patients.length} patient{patients.length !== 1 ? 's' : ''}
            {needsReviewCount > 0 && (
              <span className="review-count">
                ({needsReviewCount} need{needsReviewCount !== 1 ? '' : 's'} review)
              </span>
            )}
          </span>
          <button className="collapse-btn">
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="patient-table-container">
          <div className="patient-table">
            <div className="table-header">
              <div className="col-time">Time</div>
              <div className="col-patient">Patient</div>
              <div className="col-visit-type">Visit Type</div>
              <div className="col-status">Documentation</div>
              <div className="col-actions">Actions</div>
            </div>

            <div className="table-body">
              {patients.map((patient) => {
                const reviewStatus = getReviewStatus(patient);
                
                return (
                  <div 
                    key={patient._id} 
                    className={`patient-row ${reviewStatus.status === 'needs-review' ? 'needs-review' : ''}`}
                  >
                    <div className="col-time">
                      <span className="appointment-time">
                        {formatTime(patient.appointmentTime)}
                      </span>
                      <span className="checkout-time">
                        Out: {formatTime(patient.checkOutTime)}
                      </span>
                    </div>

                    <div className="col-patient">
                      <div className="patient-info">
                        <div className="patient-name">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="patient-details">
                          Record: {patient.recordNumber}
                          {patient.hasAlerts && (
                            <span className="alert-indicator" title="Patient has medical alerts">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-visit-type">
                      <span 
                        className="visit-type-badge"
                        style={{ 
                          backgroundColor: getVisitTypeColor(patient.visitType),
                          color: 'white'
                        }}
                      >
                        {patient.visitType || 'Standard'}
                      </span>
                    </div>

                    <div className="col-status">
                      <div className={`review-status ${reviewStatus.status}`}>
                        <span className="status-icon">{reviewStatus.icon}</span>
                        <div className="status-info">
                          <span 
                            className="status-label"
                            style={{ color: reviewStatus.color }}
                          >
                            {reviewStatus.label}
                          </span>
                          {patient.soapNote && (
                            <span className="soap-info">
                              SOAP: {patient.soapNote.isSigned ? 'Signed' : 'Unsigned'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-actions">
                      <div className="action-buttons">
                        {reviewStatus.status === 'needs-review' && (
                          <button
                            className="btn-action btn-warning"
                            onClick={() => onPatientAction(patient._id, 'openNote')}
                            title="Complete Documentation"
                          >
                            📝 Complete Note
                          </button>
                        )}
                        
                        <button
                          className="btn-action btn-secondary"
                          onClick={() => onPatientAction(patient._id, 'viewProfile')}
                          title="View Patient Profile"
                        >
                          👁️ Profile
                        </button>

                        <button
                          className="btn-action btn-primary"
                          onClick={() => onPatientAction(patient._id, 'openNote')}
                          title="Review Documentation"
                        >
                          📄 Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckedOutPatients;
