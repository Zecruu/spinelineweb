import { useState, useEffect } from 'react';
import './TodaysPatients.css';

const TodaysPatients = ({ token, user }) => {
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

  // Fetch today's appointments
  const fetchTodaysAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5001/api/appointments/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments({
          scheduled: data.data.appointments.scheduled || [],
          checkedIn: data.data.appointments.checkedIn || [],
          checkedOut: data.data.appointments.checkedOut || []
        });
      } else {
        setError('Failed to fetch today\'s appointments');
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount and when refresh is triggered
  useEffect(() => {
    fetchTodaysAppointments();
  }, [token, refreshTrigger]);

  // Check in patient
  const handleCheckIn = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/appointments/${appointmentId}/check-in`, {
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
      const response = await fetch('http://localhost:5001/api/appointments/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId })
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } else {
        setError('Failed to create walk-in appointment');
      }
    } catch (error) {
      console.error('Walk-in error:', error);
      setError('Failed to create walk-in appointment');
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
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

  // Handle patient selection
  const handlePatientSelect = (appointment) => {
    setSelectedPatient(appointment);
  };

  // Render scheduled patients table
  const renderScheduledTable = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>📅 Scheduled Patients</h3>
        <span className="count">{appointments.scheduled.length}</span>
      </div>
      <div className="table-actions">
        <button className="btn-add">+ Add Patient</button>
      </div>
      <div className="table-content">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Time</th>
              <th>Visit Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.scheduled.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No scheduled patients</td>
              </tr>
            ) : (
              appointments.scheduled.map(appointment => {
                const hexColor = colorMap[appointment.color] || colorMap.blue;
                return (
                  <tr
                    key={appointment._id}
                    className="patient-row"
                    onClick={() => handlePatientSelect(appointment)}
                    style={{
                      borderLeft: `4px solid ${hexColor}`,
                      backgroundColor: `${hexColor}08`
                    }}
                  >
                    <td className="patient-name">{getPatientName(appointment.patientId)}</td>
                    <td className="time">{formatTime(appointment.time)}</td>
                    <td className="visit-type">
                      <span className={`visit-badge ${appointment.visitType?.toLowerCase()}`}>
                        {appointment.visitType || 'Regular'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-action btn-checkin"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckIn(appointment._id);
                        }}
                      >
                        Check In
                      </button>
                      <button className="btn-action btn-edit">Edit</button>
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

  // Render checked-in patients table
  const renderCheckedInTable = () => (
    <div className="patient-table-container">
      <div className="table-header">
        <h3>✅ Checked-In Patients</h3>
        <span className="count">{appointments.checkedIn.length}</span>
      </div>
      <div className="table-actions">
        <button className="btn-add">+ Add Walk-In</button>
      </div>
      <div className="table-content">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Check-in Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.checkedIn.length === 0 ? (
              <tr>
                <td colSpan="3" className="no-data">No checked-in patients</td>
              </tr>
            ) : (
              appointments.checkedIn.map(appointment => {
                const hexColor = colorMap[appointment.color] || colorMap.blue;
                return (
                  <tr
                    key={appointment._id}
                    className="patient-row"
                    onClick={() => handlePatientSelect(appointment)}
                    style={{
                      borderLeft: `4px solid ${hexColor}`,
                      backgroundColor: `${hexColor}08`
                    }}
                  >
                    <td className="patient-name">{getPatientName(appointment.patientId)}</td>
                    <td className="time">{formatDateTime(appointment.checkInTime)}</td>
                    <td className="actions">
                      <button
                        className="btn-action btn-checkout"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to checkout page
                          window.history.pushState({}, '', `/secretary/checkout/${appointment._id}`);
                          window.location.reload();
                        }}
                      >
                        Checkout
                      </button>
                      <button className="btn-action btn-view">View</button>
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
                    onClick={() => handlePatientSelect(appointment)}
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
        <h1>📋 Today's Patients</h1>
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <span className="date">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tables-grid">
        {renderScheduledTable()}
        {renderCheckedInTable()}
        {renderCheckedOutTable()}
        {renderPatientInfo()}
      </div>
    </div>
  );
};

export default TodaysPatients;
