import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { downloadDailyReport } from '../utils/reportGenerator';
import PatientSearch from '../components/PatientSearch';
import PatientForm from '../components/PatientForm';
import './TodaysPatients.css';

const TodaysPatients = ({ token, user, onCheckout, onEditPatient }) => {
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
        console.log('Fetched appointments data:', data);

        const appointmentData = {
          scheduled: data.data.appointments.scheduled || [],
          checkedIn: data.data.appointments.checkedIn || [],
          checkedOut: data.data.appointments.checkedOut || []
        };

        // Log appointment structure for debugging
        if (appointmentData.scheduled && appointmentData.scheduled.length > 0) {
          console.log('Sample appointment structure:', appointmentData.scheduled[0]);
        }

        setAppointments(appointmentData);

        // Update tracking metrics
        setTrackingMetrics({
          scheduled: appointmentData.scheduled.length,
          checkedIn: appointmentData.checkedIn.length,
          checkedOut: appointmentData.checkedOut.length
        });

        // Clear selections when data refreshes
        setSelectedPatient(null);
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

  // Get patient type CSS class for color coding
  const getPatientTypeClass = (appointment) => {
    // Check multiple possible fields for patient type
    const patientType = appointment?.type || appointment?.visitType || appointment?.patientType || 'regular';
    console.log('Patient type for appointment:', appointment._id, 'type:', patientType);

    switch (patientType?.toLowerCase()) {
      case 'new':
        return 'patient-type-new';
      case 'regular':
        return 'patient-type-regular';
      case 'follow-up':
      case 'follow up':
        return 'patient-type-followup';
      case 'emergency':
        return 'patient-type-emergency';
      case 're-eval':
      case 'evaluation':
        return 'patient-type-followup';
      case 'walk-in':
        return 'patient-type-emergency';
      default:
        return 'patient-type-default';
    }
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    setSelectedPatient(appointment);
  };

  const handleConfirmAppointment = async (appointmentId, confirmed) => {
    try {
      console.log('Confirming appointment:', appointmentId, 'confirmed:', confirmed);
      console.log('Token:', token);

      // Update UI immediately for better UX
      setAppointments(prev => ({
        ...prev,
        scheduled: prev.scheduled.map(apt =>
          apt._id === appointmentId
            ? { ...apt, confirmed: confirmed, confirmedAt: confirmed ? new Date() : null }
            : apt
        )
      }));

      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmed })
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Appointment confirmation updated successfully');
        // Optionally refresh to ensure sync with server
        // fetchAppointments();
      } else {
        console.error('Failed to update appointment confirmation:', responseData);
        // Revert the UI change if API call failed
        setAppointments(prev => ({
          ...prev,
          scheduled: prev.scheduled.map(apt =>
            apt._id === appointmentId
              ? { ...apt, confirmed: !confirmed, confirmedAt: !confirmed ? new Date() : null }
              : apt
          )
        }));

        if (response.status === 401) {
          console.error('Authentication failed');
        }
      }
    } catch (error) {
      console.error('Error updating appointment confirmation:', error);
      // Revert the UI change if there was an error
      setAppointments(prev => ({
        ...prev,
        scheduled: prev.scheduled.map(apt =>
          apt._id === appointmentId
            ? { ...apt, confirmed: !confirmed, confirmedAt: !confirmed ? new Date() : null }
            : apt
        )
      }));
    }
  };

  // Handle edit patient - navigate to patient management
  const handleEditPatient = (patient) => {
    if (patient && patient._id && onEditPatient) {
      onEditPatient(patient._id);
    }
  };

  // Handle checkout - navigate to checkout page
  const handleCheckout = (appointment) => {
    if (appointment && appointment._id) {
      console.log('Navigating to checkout with appointment:', appointment);
      // Use the onCheckout prop passed from parent component
      if (onCheckout) {
        onCheckout(appointment._id);
      } else {
        // Fallback: use custom navigation like the app does
        window.history.pushState({}, '', `/secretary/checkout/${appointment._id}`);
        window.location.reload();
      }
    }
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







  // Render patient info preview
  const renderPatientInfo = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>👤 Patient Info</h3>
      </div>
      <div className="table-content patient-info-content">
        {selectedPatient ? (
          <div className="patient-info-display">
            {/* Patient Header with Photo and Basic Info */}
            <div className="patient-header">
              <div className="patient-photo-square">
                <div className="photo-placeholder">
                  {getPatientName(selectedPatient.patientId).split(' ').map(name => name.charAt(0)).join('')}
                </div>
              </div>
              <div className="patient-basic-details">
                <h3 className="patient-name">{getPatientName(selectedPatient.patientId)}</h3>
                <p className="record-number">Record #{selectedPatient.patientId?.recordNumber}</p>
                <p className="contact-info">
                  📞 {selectedPatient.patientId?.phone || 'No phone'}
                </p>
                <p className="contact-info">
                  ✉️ {selectedPatient.patientId?.email || 'No email'}
                </p>
              </div>
              <button
                className="btn-edit-patient"
                onClick={() => handleEditPatient(selectedPatient.patientId)}
                title="Edit Patient Information"
              >
                ✏️ Edit Patient
              </button>
            </div>

            {/* Insurance Information */}
            <div className="info-section">
              <h4 className="section-title">🏥 Insurance Information</h4>
              <div className="insurance-details">
                {selectedPatient.patientId?.insuranceInfo && selectedPatient.patientId.insuranceInfo.length > 0 ? (
                  selectedPatient.patientId.insuranceInfo
                    .filter(insurance => insurance.isActive)
                    .map((insurance, index) => (
                      <div key={index} className="insurance-item">
                        <div className="insurance-row">
                          <span className="label">Provider:</span>
                          <span className="value">{insurance.companyName || 'Unknown'}</span>
                        </div>
                        <div className="insurance-row">
                          <span className="label">Policy #:</span>
                          <span className="value">{insurance.policyNumber || 'N/A'}</span>
                        </div>
                        <div className="insurance-row">
                          <span className="label">Copay:</span>
                          <span className="value copay">${insurance.copay || 0}</span>
                        </div>
                        {insurance.isPrimary && (
                          <span className="primary-badge">Primary</span>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="no-insurance">
                    <span className="self-pay-badge">Self-Pay Patient</span>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Information */}
            <div className="info-section">
              <h4 className="section-title">👨‍⚕️ Referral Information</h4>
              <div className="referral-details">
                {selectedPatient.patientId?.referral ? (
                  <div className="referral-item">
                    <div className="referral-row">
                      <span className="label">Referred By:</span>
                      <span className="value">
                        {selectedPatient.patientId.referral.referredBy?.firstName} {selectedPatient.patientId.referral.referredBy?.lastName || 'Unknown'}
                      </span>
                    </div>
                    <div className="referral-row">
                      <span className="label">Source:</span>
                      <span className="value">{selectedPatient.patientId.referral.source || 'N/A'}</span>
                    </div>
                    {selectedPatient.patientId.referral.validDays && (
                      <div className="referral-row">
                        <span className="label">Valid Days:</span>
                        <span className="value">{selectedPatient.patientId.referral.validDays} days</span>
                      </div>
                    )}
                    {selectedPatient.patientId.referral.bonusAmount && (
                      <div className="referral-row">
                        <span className="label">Bonus:</span>
                        <span className="value bonus">${selectedPatient.patientId.referral.bonusAmount}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-referral">
                    <span className="direct-patient-badge">Direct Patient</span>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="info-section">
              <h4 className="section-title">📅 Appointment Details</h4>
              <div className="appointment-details">
                <div className="appointment-row">
                  <span className="label">Type:</span>
                  <span className="value visit-type">{selectedPatient.visitType}</span>
                </div>
                <div className="appointment-row">
                  <span className="label">Status:</span>
                  <span className={`value status-${selectedPatient.status}`}>
                    {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                  </span>
                </div>
                <div className="appointment-row">
                  <span className="label">Time:</span>
                  <span className="value">{formatTime(selectedPatient.time)}</span>
                </div>
                {selectedPatient.checkInTime && (
                  <div className="appointment-row">
                    <span className="label">Checked In:</span>
                    <span className="value">{formatDateTime(selectedPatient.checkInTime)}</span>
                  </div>
                )}
                {selectedPatient.reason && (
                  <div className="appointment-row full-width">
                    <span className="label">Reason:</span>
                    <span className="value reason">{selectedPatient.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-icon">👤</div>
            <h4>No Patient Selected</h4>
            <p>Click on a patient from any table to view their details</p>
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

      {/* Excel-styled Tables */}
      <div className="excel-tables-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.25rem',
        width: '100%',
        height: 'calc(100vh - 200px)',
        marginTop: '2rem',
        padding: '0 0.25rem'
      }}>
        {/* Scheduled Patients Table */}
        <div className="excel-table-section" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 className="table-title">Scheduled Patients</h2>
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Record Number</th>
                  <th>Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {appointments.scheduled.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-data">No scheduled patients</td>
                  </tr>
                ) : (
                  // Sort appointments: confirmed first, then by time
                  appointments.scheduled
                    .sort((a, b) => {
                      if (a.confirmed && !b.confirmed) return -1;
                      if (!a.confirmed && b.confirmed) return 1;
                      return new Date(a.appointmentTime) - new Date(b.appointmentTime);
                    })
                    .map(appointment => (
                    <tr
                      key={appointment._id}
                      className={`excel-row ${selectedPatient?._id === appointment._id ? 'selected' : ''} ${getPatientTypeClass(appointment)} ${appointment.confirmed ? 'confirmed-patient' : ''}`}
                      onClick={() => handleAppointmentSelect(appointment)}
                    >
                      <td className={appointment.confirmed ? 'confirmed-text' : ''}>{getPatientName(appointment.patientId)}</td>
                      <td className={appointment.confirmed ? 'confirmed-text' : ''}>{appointment.patientId?.recordNumber || 'N/A'}</td>
                      <td className="confirm-cell">
                        <input
                          type="checkbox"
                          checked={appointment.confirmed || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleConfirmAppointment(appointment._id, !appointment.confirmed);
                          }}
                          className="confirm-checkbox"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="table-buttons">
            <button
              className="excel-btn check-in-btn"
              onClick={() => selectedPatient && selectedPatient.status === 'scheduled' && handleCheckIn(selectedPatient._id)}
              disabled={!selectedPatient || selectedPatient.status !== 'scheduled'}
            >
              Check In
            </button>
            <button
              className="excel-btn walk-in-btn"
              onClick={handleAddWalkInButton}
            >
              Walk In Patient
            </button>
          </div>
        </div>

        {/* Checked In Patients Table */}
        <div className="excel-table-section" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 className="table-title">Checked In Patients</h2>
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Patient Type</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {appointments.checkedIn.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-data">No checked-in patients</td>
                  </tr>
                ) : (
                  appointments.checkedIn.map(appointment => {
                    const isDoctorSigned = appointment.doctorSigned || appointment.soapNote?.isCompleted || false;
                    return (
                      <tr
                        key={appointment._id}
                        className={`excel-row ${selectedPatient?._id === appointment._id ? 'selected' : ''} ${getPatientTypeClass(appointment)}`}
                        onClick={() => handleAppointmentSelect(appointment)}
                      >
                        <td>{getPatientName(appointment.patientId)}</td>
                        <td>{appointment.visitType || appointment.type || 'Regular'}</td>
                        <td className="completed-cell">
                          {isDoctorSigned ? (
                            <span className="completed-yes">✓</span>
                          ) : (
                            <span className="completed-no">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="table-buttons">
            <button
              className="excel-btn checkout-btn"
              onClick={() => selectedPatient && handleCheckout(selectedPatient)}
              disabled={!selectedPatient || selectedPatient.status !== 'checked-in'}
            >
              Checkout
            </button>
            <button
              className="excel-btn uncheck-btn"
              onClick={() => selectedPatient && handleUncheckPatient(selectedPatient._id)}
              disabled={!selectedPatient || selectedPatient.status !== 'checked-in'}
            >
              Uncheck Patient
            </button>
          </div>
        </div>

        {/* Checked Out Patients Table */}
        <div className="excel-table-section" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 className="table-title">Checked Out Patients</h2>
          <div className="excel-table-wrapper">
            <table className="excel-table">
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
                  appointments.checkedOut.map(appointment => (
                    <tr
                      key={appointment._id}
                      className={`excel-row ${selectedPatient?._id === appointment._id ? 'selected' : ''}`}
                      onClick={() => handleAppointmentSelect(appointment)}
                    >
                      <td>{getPatientName(appointment.patientId)}</td>
                      <td>{formatDateTime(appointment.checkOutTime)}</td>
                      <td>{appointment.paymentMethod || 'N/A'}</td>
                      <td>${((appointment.totalAmount || 0) - (appointment.amountPaid || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
