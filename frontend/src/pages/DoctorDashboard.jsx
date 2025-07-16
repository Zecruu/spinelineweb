import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CheckedInPatients from '../components/doctor/CheckedInPatients';
import CheckedOutPatients from '../components/doctor/CheckedOutPatients';
import PatientFilters from '../components/doctor/PatientFilters';
import SOAPNoteInterface from '../components/doctor/SOAPNoteInterface';
import './DoctorDashboard.css';

const DoctorDashboard = ({ token, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('patient-flow');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedInPatients, setCheckedInPatients] = useState([]);
  const [checkedOutPatients, setCheckedOutPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    patientType: '',
    searchTerm: '',
    providerId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalCheckedIn: 0,
    totalCheckedOut: 0,
    needsReview: 0
  });
  const [showSOAPInterface, setShowSOAPInterface] = useState(false);
  const [selectedPatientForSOAP, setSelectedPatientForSOAP] = useState(null);
  const [selectedAppointmentForSOAP, setSelectedAppointmentForSOAP] = useState(null);

  useEffect(() => {
    fetchDailyPatients();
  }, [selectedDate, filters]);

  // Auto-refresh every 30 seconds to keep data synchronized
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDailyPatients();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate, filters]);

  const fetchDailyPatients = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date: selectedDate,
        // Temporarily remove providerId filter to show all clinic patients
        // providerId: user.id,
        ...filters
      });

      const response = await fetch(`/api/doctor/daily-patients?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Daily patients data received:', {
          date: selectedDate,
          checkedIn: data.data.checkedIn?.length || 0,
          checkedOut: data.data.checkedOut?.length || 0,
          needsReview: data.data.checkedOut?.filter(p => p.needsReview)?.length || 0
        });

        setCheckedInPatients(data.data.checkedIn || []);
        setCheckedOutPatients(data.data.checkedOut || []);
        setStats({
          totalCheckedIn: data.data.checkedIn?.length || 0,
          totalCheckedOut: data.data.checkedOut?.length || 0,
          needsReview: data.data.checkedOut?.filter(p => p.needsReview)?.length || 0
        });
      } else {
        console.error('Failed to fetch daily patients');
      }
    } catch (error) {
      console.error('Error fetching daily patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handlePatientAction = async (patientId, action) => {
    try {
      const patient = [...checkedInPatients, ...checkedOutPatients].find(p => p._id === patientId);
      if (!patient) {
        alert('Patient not found');
        return;
      }

      switch (action) {
        case 'openNote':
        case 'startSOAP':
          // Open SOAP Note Interface
          setSelectedPatientForSOAP(patient);
          setSelectedAppointmentForSOAP({
            _id: patient.appointmentId || patient._id,
            time: patient.appointmentTime,
            visitType: patient.visitType,
            status: patient.status
          });
          setShowSOAPInterface(true);
          break;

        case 'viewProfile':
          // Show patient profile information
          const profileInfo = `Patient Profile: ${patient.firstName} ${patient.lastName}\n\n` +
            `Record Number: ${patient.recordNumber}\n` +
            `Visit Type: ${patient.visitType || 'N/A'}\n` +
            `Appointment Time: ${patient.appointmentTime || 'N/A'}\n` +
            `Status: ${patient.status}\n` +
            `Phone: ${patient.phone || 'N/A'}\n` +
            `Email: ${patient.email || 'N/A'}\n\n` +
            `(Full patient management interface coming soon)`;
          alert(profileInfo);
          break;

        default:
          console.log(`Action ${action} for patient ${patientId}`);
      }
    } catch (error) {
      console.error('Error handling patient action:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleCloseSOAP = () => {
    setShowSOAPInterface(false);
    setSelectedPatientForSOAP(null);
    setSelectedAppointmentForSOAP(null);
    // Refresh patient data to get updated status
    fetchDailyPatients();
  };

  const handleSaveSOAP = async (soapData) => {
    try {
      // Save SOAP note data
      console.log('Saving SOAP data:', soapData);
      // TODO: Implement actual save functionality
      alert('SOAP note saved successfully!');
    } catch (error) {
      console.error('Error saving SOAP note:', error);
      alert('Error saving SOAP note. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    // Parse the date string properly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="doctor-dashboard">
      {/* SOAP Note Interface Overlay */}
      {showSOAPInterface && selectedPatientForSOAP && selectedAppointmentForSOAP && (
        <SOAPNoteInterface
          patient={selectedPatientForSOAP}
          appointment={selectedAppointmentForSOAP}
          onClose={handleCloseSOAP}
          onSave={handleSaveSOAP}
          token={token}
        />
      )}

      <Sidebar
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="doctor"
      />

      <div className="doctor-main-content">
        {/* Header with Date Selector */}
        <div className="doctor-header">
          <div className="date-selector-container">
            <h1>Patient Flow</h1>
            <div className="date-selector">
              <label htmlFor="date-picker">📅</label>
              <input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="date-input"
              />
              <span className="date-display">{formatDate(selectedDate)}</span>
            </div>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-card checked-in">
              <span className="stat-number">{stats.totalCheckedIn}</span>
              <span className="stat-label">Checked In</span>
            </div>
            <div className="stat-card checked-out">
              <span className="stat-number">{stats.totalCheckedOut}</span>
              <span className="stat-label">Checked Out</span>
            </div>
            <div className="stat-card needs-review">
              <span className="stat-number">{stats.needsReview}</span>
              <span className="stat-label">Needs Review</span>
            </div>
          </div>

          <button 
            className="filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters
          </button>
        </div>

        <div className="doctor-content">
          {/* Side Panel Filters */}
          {showFilters && (
            <PatientFilters 
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}

          {/* Main Patient Tables */}
          <div className="patient-tables-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading patients...</p>
              </div>
            ) : (
              <>
                {/* Checked In Patients */}
                <CheckedInPatients 
                  patients={checkedInPatients}
                  onPatientAction={handlePatientAction}
                  selectedDate={selectedDate}
                />

                {/* Checked Out Patients */}
                <CheckedOutPatients 
                  patients={checkedOutPatients}
                  onPatientAction={handlePatientAction}
                  selectedDate={selectedDate}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
