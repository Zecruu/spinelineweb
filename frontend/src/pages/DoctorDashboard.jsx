import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CheckedInPatients from '../components/doctor/CheckedInPatients';
import CheckedOutPatients from '../components/doctor/CheckedOutPatients';
import PatientFilters from '../components/doctor/PatientFilters';
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

  useEffect(() => {
    fetchDailyPatients();
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

  const handlePatientAction = (patientId, action) => {
    switch (action) {
      case 'openNote':
        console.log(`Opening encounter note for patient ${patientId}`);
        // TODO: Implement encounter navigation when routing is added
        break;
      case 'viewProfile':
        console.log(`Viewing profile for patient ${patientId}`);
        // TODO: Implement patient profile navigation when routing is added
        break;
      case 'startSOAP':
        console.log(`Starting SOAP note for patient ${patientId}`);
        // TODO: Implement SOAP note navigation when routing is added
        break;
      default:
        console.log(`Action ${action} for patient ${patientId}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
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
