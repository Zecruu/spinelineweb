import { useState } from 'react';
import './CheckedInPatients.css';

const CheckedInPatients = ({ patients, onPatientAction, selectedDate }) => {
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

  const getPatientInitials = (firstName, lastName) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(lastName.length - 1)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const getTimeStatus = (appointmentTime) => {
    if (!appointmentTime) return 'scheduled';
    
    const now = new Date();
    const appointmentDateTime = new Date(`${selectedDate}T${appointmentTime}`);
    const diffMinutes = (now - appointmentDateTime) / (1000 * 60);
    
    if (diffMinutes > 30) return 'overdue';
    if (diffMinutes > 15) return 'running-late';
    if (diffMinutes > 0) return 'on-time';
    return 'upcoming';
  };

  const getTimeStatusColor = (status) => {
    const colors = {
      'upcoming': '#94a3b8',
      'on-time': '#10b981',
      'running-late': '#f59e0b',
      'overdue': '#ef4444',
      'scheduled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (!patients || patients.length === 0) {
    return (
      <div className="patient-table-section">
        <div className="section-header">
          <h2>✅ Checked In Patients</h2>
          <span className="patient-count">0 patients</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No patients checked in for {new Date(selectedDate).toLocaleDateString()}</p>
          <small>Patients will appear here once they check in for their appointments</small>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-table-section">
      <div className="section-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>✅ Checked In Patients</h2>
        <div className="header-controls">
          <span className="patient-count">{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
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
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>

            <div className="table-body">
              {patients.map((patient) => {
                const timeStatus = getTimeStatus(patient.appointmentTime);
                const timeStatusColor = getTimeStatusColor(timeStatus);
                
                return (
                  <div key={patient._id} className="patient-row">
                    <div className="col-time">
                      <span 
                        className="appointment-time"
                        style={{ color: timeStatusColor }}
                      >
                        {formatTime(patient.appointmentTime)}
                      </span>
                      <span className="time-status">{timeStatus.replace('-', ' ')}</span>
                    </div>

                    <div className="col-patient">
                      <div className="patient-info">
                        <div className="patient-avatar">
                          <div className="avatar-circle">
                            {getPatientInitials(patient.firstName, patient.lastName)}
                          </div>
                        </div>
                        <div className="patient-details-wrapper">
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
                      <div className="status-indicator active">
                        <div className="status-dot"></div>
                        <span>Active</span>
                      </div>
                    </div>

                    <div className="col-actions">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-primary"
                          onClick={() => onPatientAction(patient._id, 'openNote')}
                          title="Open SOAP Note"
                        >
                          📄 Open Note
                        </button>
                        
                        <button
                          className="btn-action btn-secondary"
                          onClick={() => onPatientAction(patient._id, 'viewProfile')}
                          title="View Patient Profile"
                        >
                          👁️ Profile
                        </button>

                        {!patient.hasSOAPNote && (
                          <button
                            className="btn-action btn-warning"
                            onClick={() => onPatientAction(patient._id, 'startSOAP')}
                            title="Start SOAP Note"
                          >
                            📋 Start Note
                          </button>
                        )}
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

export default CheckedInPatients;
