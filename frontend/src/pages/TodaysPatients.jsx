import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { downloadDailyReport } from '../utils/reportGenerator';
import PatientSearch from '../components/PatientSearch';
import PatientForm from '../components/PatientForm';
import './TodaysPatients.css';

const TodaysPatients = ({ token, user, onCheckout }) => {
  // Color mapping for appointment colors
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    orange: '#f97316',
    white: '#f8fafc'
  };
  const [appointments, setAppointments] = useState({
    scheduled: [],
    checkedIn: [],
    checkedOut: []
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackingMetrics, setTrackingMetrics] = useState({
    scheduled: 0,
    checkedIn: 0,
    checkedOut: 0
  });
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [searchType, setSearchType] = useState(''); // 'add-patient' or 'add-walkin'
  const [selectedPatientForAction, setSelectedPatientForAction] = useState(null);
  const [selectedScheduledPatient, setSelectedScheduledPatient] = useState(null);
  const [selectedCheckedInPatient, setSelectedCheckedInPatient] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({
    time: '',
    visitType: 'Regular',
    color: 'blue'
  });

  // Fetch appointments for selected date
  const fetchAppointments = async (date = selectedDate) => {
    try {
      setLoading(true);
      setError('');

      const endpoint = date === new Date().toISOString().split('T')[0]
        ? `${API_BASE_URL}/api/appointments/today`
        : `${API_BASE_URL}/api/appointments/date/${date}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const appointmentData = {
          scheduled: data.data.appointments.scheduled || [],
          checkedIn: data.data.appointments.checkedIn || [],
          checkedOut: data.data.appointments.checkedOut || []
        };

        setAppointments(appointmentData);

        // Update tracking metrics
        setTrackingMetrics({
          scheduled: appointmentData.scheduled.length,
          checkedIn: appointmentData.checkedIn.length,
          checkedOut: appointmentData.checkedOut.length
        });

        // Clear selections when data refreshes
        setSelectedScheduledPatient(null);
        setSelectedCheckedInPatient(null);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount and when refresh is triggered or date changes
  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [token, refreshTrigger, selectedDate]);

  // Check in patient
  const handleCheckIn = async (appointmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } else {
        setError('Failed to check in patient');
      }
    } catch (error) {
      console.error('Check in error:', error);
      setError('Failed to check in patient');
    }
  };

  // Create walk-in appointment
  const handleAddWalkIn = async (patientId) => {
    try {
      console.log('Creating walk-in appointment for patient:', patientId);

      const response = await fetch(`${API_BASE_URL}/api/appointments/walk-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId })
      });

      console.log('Walk-in creation response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Walk-in created successfully:', responseData);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
        alert('Walk-in appointment created successfully');
      } else {
        const errorData = await response.json();
        console.error('Walk-in creation failed:', errorData);
        setError(errorData.message || 'Failed to create walk-in appointment');
      }
    } catch (error) {
      console.error('Walk-in error:', error);
      setError('Failed to create walk-in appointment');
    }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';

    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) return timeString;

    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];

    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    if (hours === 0) {
      hours = 12; // 12 AM
    } else if (hours > 12) {
      hours = hours - 12; // Convert to PM
    }

    return `${hours}:${minutes} ${ampm}`;
  };

  // Handle add patient button
  const handleAddPatient = () => {
    setSearchType('add-patient');
    setShowPatientSearch(true);
  };

  // Handle add walk-in button
  const handleAddWalkInButton = () => {
    setSearchType('add-walkin');
    setShowPatientSearch(true);
  };

  // Handle patient selection from search modal (just select, don't confirm yet)
  const handlePatientSelectForWalkIn = (patient) => {
    setSelectedPatientForAction(patient);
  };

  // Handle confirming the selected patient
  const handleConfirmPatientSelection = async () => {
    if (!selectedPatientForAction) return;

    console.log('User data:', user);
    console.log('Selected patient:', selectedPatientForAction);

    if (searchType === 'add-walkin') {
      handleAddWalkIn(selectedPatientForAction._id);
    } else if (searchType === 'add-patient') {
      // Create a scheduled appointment for today
      try {
        const today = new Date();
        const timeString = today.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });

        const appointmentData = {
          patientId: selectedPatientForAction._id,
          date: today, // Send as Date object
          time: appointmentDetails.time || timeString,
          type: appointmentDetails.visitType.toLowerCase().replace(' ', '-'), // Convert to enum format
          visitType: appointmentDetails.visitType,
          status: 'scheduled',
          reason: 'Scheduled appointment',
          color: appointmentDetails.color
          // Note: createdBy, lastModifiedBy, and clinicId are set by the backend middleware
        };

        console.log('Creating appointment with data:', appointmentData);

        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(appointmentData)
        });

        console.log('Appointment creation response status:', response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log('Appointment created successfully:', responseData);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh
          alert(`Appointment scheduled for ${selectedPatientForAction.firstName} ${selectedPatientForAction.lastName}`);
        } else {
          const errorData = await response.json();
          console.error('Appointment creation failed:', errorData);
          console.error('Full error details:', JSON.stringify(errorData, null, 2));
          setError(errorData.message || errorData.errors?.join(', ') || 'Failed to schedule appointment');
        }
      } catch (error) {
        console.error('Schedule appointment error:', error);
        setError('Failed to schedule appointment');
      }
    }

    // Reset state
    setShowPatientSearch(false);
    setSearchType('');
    setSelectedPatientForAction(null);
    setAppointmentDetails({
      time: '',
      visitType: 'Regular',
      color: 'blue'
    });
  };

  // Handle canceling patient selection
  const handleCancelPatientSelection = () => {
    setShowPatientSearch(false);
    setSearchType('');
    setSelectedPatientForAction(null);
    setAppointmentDetails({
      time: '',
      visitType: 'Regular',
      color: 'blue'
    });
  };

  // Handle create new patient
  const handleCreateNewPatient = () => {
    setShowPatientSearch(false);
    setShowPatientForm(true);
  };

  // Handle patient form save
  const handlePatientSave = () => {
    setShowPatientForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle unchecking a patient
  const handleUncheckPatient = async (appointmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/uncheck`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } else {
        setError('Failed to uncheck patient');
      }
    } catch (error) {
      console.error('Uncheck error:', error);
      setError('Failed to uncheck patient');
    }
  };

  // Format date/time
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get patient full name
  const getPatientName = (patient) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    setSelectedPatient(appointment);
  };

  // Generate daily report
  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      // Fetch detailed report data from the API
      const response = await fetch(`${API_BASE_URL}/api/appointments/reports/daily/${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const reportData = {
          date: selectedDate,
          appointments: data.data.appointments,
          summary: data.data.summary,
          ledgerEntries: data.data.ledgerEntries,
          customNotes: '' // Can be made configurable later
        };

        const filename = `daily-production-report-${selectedDate}.pdf`;
        downloadDailyReport(reportData, filename);
      } else {
        setError('Failed to generate report data');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Failed to generate daily report');
    } finally {
      setLoading(false);
    }
  };

  // Render scheduled patients table
  const renderScheduledTable = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>📅 Scheduled Patients</h3>
        <span className="count">{appointments.scheduled.length}</span>
      </div>
      <div className="table-actions">
        <button className="btn-add" onClick={handleAddPatient}>+ Add Patient</button>
      </div>
      <div className="table-content">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Time</th>
              <th>Visit Type</th>
            </tr>
          </thead>
          <tbody>
            {appointments.scheduled.length === 0 ? (
              <tr>
                <td colSpan="3" className="no-data">No scheduled patients</td>
              </tr>
            ) : (
              appointments.scheduled.map(appointment => {
                const hexColor = colorMap[appointment.color] || colorMap.blue;
                const isSelected = selectedScheduledPatient?._id === appointment._id;
                return (
                  <tr
                    key={appointment._id}
                    className={`patient-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedScheduledPatient(appointment)}
                    style={{
                      borderLeft: `4px solid ${hexColor}`,
                      backgroundColor: isSelected ? `${hexColor}20` : `${hexColor}08`
                    }}
                  >
                    <td className="patient-name">{getPatientName(appointment.patientId)}</td>
                    <td className="time">{formatTime(appointment.time)}</td>
                    <td className="visit-type">
                      <span className={`visit-badge ${appointment.visitType?.toLowerCase()}`}>
                        {appointment.visitType || 'Regular'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="table-bottom-actions">
        <button
          className="btn-action btn-checkin"
          onClick={() => selectedScheduledPatient && handleCheckIn(selectedScheduledPatient._id)}
          disabled={!selectedScheduledPatient}
        >
          Check In Selected Patient
        </button>
        <button
          className="btn-action btn-edit"
          disabled={!selectedScheduledPatient}
        >
          Edit Selected Patient
        </button>
      </div>
    </div>
  );

  // Render checked-in patients table
  const renderCheckedInTable = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>✅ Checked-In Patients</h3>
        <span className="count">{appointments.checkedIn.length}</span>
      </div>

      <div className="table-content">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>
            {appointments.checkedIn.length === 0 ? (
              <tr>
                <td colSpan="2" className="no-data">No checked-in patients</td>
              </tr>
            ) : (
              appointments.checkedIn.map(appointment => {
                const hexColor = colorMap[appointment.color] || colorMap.blue;
                const isSelected = selectedCheckedInPatient?._id === appointment._id;
                return (
                  <tr
                    key={appointment._id}
                    className={`patient-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCheckedInPatient(appointment)}
                    style={{
                      borderLeft: `4px solid ${hexColor}`,
                      backgroundColor: isSelected ? `${hexColor}20` : `${hexColor}08`
                    }}
                  >
                    <td className="patient-name">{getPatientName(appointment.patientId)}</td>
                    <td className="time">{formatDateTime(appointment.checkInTime)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="table-bottom-actions">
        <button
          className="btn-action btn-checkout"
          onClick={() => selectedCheckedInPatient && onCheckout && onCheckout(selectedCheckedInPatient._id)}
          disabled={!selectedCheckedInPatient}
        >
          Checkout Selected Patient
        </button>
        <button
          className="btn-action btn-uncheck"
          onClick={() => selectedCheckedInPatient && handleUncheckPatient(selectedCheckedInPatient._id)}
          disabled={!selectedCheckedInPatient}
        >
          Uncheck Selected Patient
        </button>
      </div>
    </div>
  );

  // Render checked-out patients table
  const renderCheckedOutTable = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>💳 Checked-Out Patients</h3>
        <span className="count">{appointments.checkedOut.length}</span>
      </div>
      <div className="table-content">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Checkout Time</th>
              <th>Payment</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {appointments.checkedOut.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No checked-out patients</td>
              </tr>
            ) : (
              appointments.checkedOut.map(appointment => {
                const hexColor = colorMap[appointment.color] || colorMap.blue;
                return (
                  <tr
                    key={appointment._id}
                    className="patient-row"
                    onClick={() => handleAppointmentSelect(appointment)}
                    style={{
                      borderLeft: `4px solid ${hexColor}`,
                      backgroundColor: `${hexColor}08`
                    }}
                  >
                    <td className="patient-name">{getPatientName(appointment.patientId)}</td>
                    <td className="time">{formatDateTime(appointment.checkOutTime)}</td>
                    <td className="payment">
                      <span className={`payment-badge ${appointment.paymentMethod}`}>
                        {appointment.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="balance">
                      ${((appointment.totalAmount || 0) - (appointment.amountPaid || 0)).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render patient info preview
  const renderPatientInfo = () => (
    <div className="patient-info-container">
      <div className="table-header">
        <h3>👤 Patient Info</h3>
      </div>
      <div className="patient-info-content">
        {selectedPatient ? (
          <div className="patient-details">
            <div className="patient-avatar">
              <div className="avatar-placeholder">
                {getPatientName(selectedPatient.patientId).charAt(0)}
              </div>
            </div>
            <div className="patient-basic-info">
              <h4>{getPatientName(selectedPatient.patientId)}</h4>
              <p className="record-number">#{selectedPatient.patientId?.recordNumber}</p>
              <p className="phone">{selectedPatient.patientId?.phone || 'No phone'}</p>
              <p className="email">{selectedPatient.patientId?.email || 'No email'}</p>
            </div>
            <div className="appointment-info">
              <h5>Appointment Details</h5>
              <p><strong>Type:</strong> {selectedPatient.visitType}</p>
              <p><strong>Status:</strong> {selectedPatient.status}</p>
              <p><strong>Time:</strong> {formatTime(selectedPatient.time)}</p>
              {selectedPatient.checkInTime && (
                <p><strong>Checked In:</strong> {formatDateTime(selectedPatient.checkInTime)}</p>
              )}
            </div>
            {selectedPatient.reason && (
              <div className="visit-reason">
                <h5>Reason for Visit</h5>
                <p>{selectedPatient.reason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-selection">
            <p>Select a patient to view details</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="todays-patients">
      <div className="page-header">
        <h1>📋 Patient Flow</h1>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-selector"
          />
          <button
            className="btn-refresh"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="btn-report"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            📊 Daily Report
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Patient Flow Tracking Metrics */}
      <div className="tracking-metrics">
        <div className="metric-card scheduled">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-number">{trackingMetrics.scheduled}</div>
            <div className="metric-label">Scheduled</div>
          </div>
        </div>
        <div className="metric-card checked-in">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-number">{trackingMetrics.checkedIn}</div>
            <div className="metric-label">Checked-In</div>
          </div>
        </div>
        <div className="metric-card checked-out">
          <div className="metric-icon">💳</div>
          <div className="metric-content">
            <div className="metric-number">{trackingMetrics.checkedOut}</div>
            <div className="metric-label">Checked-Out</div>
          </div>
        </div>
        <div className="metric-card total">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-number">
              {trackingMetrics.scheduled + trackingMetrics.checkedIn + trackingMetrics.checkedOut}
            </div>
            <div className="metric-label">Total Patients</div>
          </div>
        </div>
      </div>

      <div className="tables-grid">
        {renderScheduledTable()}
        {renderCheckedInTable()}
        {renderCheckedOutTable()}
        {renderPatientInfo()}
      </div>

      {/* Patient Search Modal */}
      {showPatientSearch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{searchType === 'add-walkin' ? 'Select Patient for Walk-In' : 'Select Patient to Schedule'}</h3>
              <button
                className="btn-close"
                onClick={handleCancelPatientSelection}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <PatientSearch
                token={token}
                onPatientSelect={handlePatientSelectForWalkIn}
                onCreateNew={handleCreateNewPatient}
                showCreateNew={true}
              />

              {/* Selected Patient Display and Appointment Details */}
              {selectedPatientForAction && (
                <div className="appointment-form">
                  <div className="selected-patient-display">
                    <h4>Selected Patient:</h4>
                    <div className="patient-details">
                      <div className="patient-avatar">
                        {selectedPatientForAction.firstName?.[0]}{selectedPatientForAction.lastName?.[0]}
                      </div>
                      <div className="patient-info">
                        <div className="patient-name">
                          {selectedPatientForAction.firstName} {selectedPatientForAction.lastName}
                        </div>
                        <div className="patient-record">
                          Record #: {selectedPatientForAction.recordNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <h4>Appointment Details:</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Time:</label>
                        <input
                          type="time"
                          value={appointmentDetails.time}
                          onChange={(e) => setAppointmentDetails(prev => ({
                            ...prev,
                            time: e.target.value
                          }))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Visit Type:</label>
                        <select
                          value={appointmentDetails.visitType}
                          onChange={(e) => setAppointmentDetails(prev => ({
                            ...prev,
                            visitType: e.target.value
                          }))}
                          className="form-select"
                        >
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
                      <div className="form-group">
                        <label>Color:</label>
                        <select
                          value={appointmentDetails.color}
                          onChange={(e) => setAppointmentDetails(prev => ({
                            ...prev,
                            color: e.target.value
                          }))}
                          className="form-select color-select"
                        >
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="red">Red</option>
                          <option value="yellow">Yellow</option>
                          <option value="purple">Purple</option>
                          <option value="orange">Orange</option>
                          <option value="white">White</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Confirm/Cancel */}
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCancelPatientSelection}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmPatientSelection}
                disabled={!selectedPatientForAction}
              >
                {searchType === 'add-walkin' ? 'Add Walk-In' : 'Schedule Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Form Modal */}
      {showPatientForm && (
        <div className="modal-overlay">
          <div className="modal-content patient-form-modal">
            <PatientForm
              token={token}
              onSave={handlePatientSave}
              onCancel={() => setShowPatientForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysPatients;
