import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import TodaysPatients from './TodaysPatients';
import SchedulingSystem from './SchedulingSystem';
import AppointmentScheduler from './AppointmentScheduler';
import PatientSearch from '../components/PatientSearch';
import PatientForm from '../components/PatientForm';
import Settings from './Settings';
import './SecretaryDashboard.css';

const SecretaryDashboard = ({ token, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('todays-patients');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);

  // Fetch patients
  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: 'active'
      });
      
      if (search) {
        queryParams.append('search', search);
      }

      const response = await fetch(`${API_BASE_URL}/api/patients?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data.patients);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.pages);
        setTotalPatients(data.data.pagination.total);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => onLogout(), 2000);
      } else {
        setError('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Fetch patients error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load patients on component mount
  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients();
    }
  }, [activeTab, token]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchPatients(newPage, searchTerm);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Patient form handlers
  const handlePatientSave = (savedPatient) => {
    // Refresh the patient list
    fetchPatients(currentPage, searchTerm);
    setShowPatientForm(false);
    setEditingPatientId(null);
  };

  const handleEditPatient = (patientId) => {
    setEditingPatientId(patientId);
    setShowPatientForm(true);
  };

  const handleClosePatientForm = () => {
    setShowPatientForm(false);
    setEditingPatientId(null);
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const renderPatientManagement = () => (
    <div className="patient-management">
      <div className="section-header">
        <div className="header-left">
          <h2>👥 Patient Management</h2>
          <span className="patient-count">{totalPatients} patients</span>
        </div>
        <div className="header-right">
          <button className="btn-primary">
            <span>+</span> New Patient
          </button>
        </div>
      </div>

      <div className="search-section">
        <PatientSearch
          token={token}
          onPatientSelect={(patient) => {
            // When a patient is selected from search, show them in the table
            setPatients([patient]);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalPatients(1);
          }}
          placeholder="Search patients by name, record number, email, or phone..."
          showCreateNew={true}
          onCreateNew={() => {
            setEditingPatientId(null);
            setShowPatientForm(true);
          }}
        />
      </div>

      {loading && <div className="loading">Loading patients...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="patients-table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Record #</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Last Visit</th>
                  <th>Total Visits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-patients">
                      {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                    </td>
                  </tr>
                ) : (
                  patients.map(patient => (
                    <tr key={patient._id} className="patient-row">
                      <td className="record-number">{patient.recordNumber}</td>
                      <td className="patient-name">
                        <div className="name-container">
                          <span className="full-name">{patient.fullName}</span>
                          {patient.gender && (
                            <span className="gender">{patient.gender}</span>
                          )}
                        </div>
                      </td>
                      <td className="age">{patient.age || 'N/A'}</td>
                      <td className="phone">{formatPhone(patient.phone)}</td>
                      <td className="email">{patient.email || 'N/A'}</td>
                      <td className="last-visit">{formatDate(patient.lastVisit)}</td>
                      <td className="total-visits">{patient.totalVisits || 0}</td>
                      <td className="status">
                        <span className={`status-badge ${patient.status?.toLowerCase()}`}>
                          {patient.status || 'Active'}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-action btn-view"
                          title="View Patient"
                          onClick={() => handleEditPatient(patient._id)}
                        >
                          👁️
                        </button>
                        <button
                          className="btn-action btn-edit"
                          title="Edit Patient"
                          onClick={() => handleEditPatient(patient._id)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          title="Delete Patient"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
                              // TODO: Implement delete functionality
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="secretary-dashboard">
      {/* Top Header with Hamburger */}
      <div className="top-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="header-title">
          <h1>🏥 SpineLine</h1>
          <span className="clinic-name">{user.clinic?.name}</span>
        </div>
        <div className="header-user">
          <div className="user-avatar">
            {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
          </div>
          <span className="user-name">{user.name || user.username}</span>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h1>🏥 SpineLine</h1>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
            <div className="clinic-name">{user.clinic?.name}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'todays-patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('todays-patients')}
          >
            📋 Today's Patients
          </button>
          <button
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            👥 Patient Management
          </button>
          <button
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Schedule
          </button>
          <button
            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            💰 Billing
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📊 Reports
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">

        <div className="content-area">
          {activeTab === 'todays-patients' && (
            <TodaysPatients token={token} user={user} />
          )}
          {activeTab === 'patients' && renderPatientManagement()}
          {activeTab === 'schedule' && (
            <AppointmentScheduler token={token} user={user} />
          )}
          {activeTab === 'billing' && (
            <div className="coming-soon">
              <h2>💰 Billing</h2>
              <p>Billing management coming soon...</p>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="coming-soon">
              <h2>📊 Reports</h2>
              <p>Reports and analytics coming soon...</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <Settings token={token} user={user} />
          )}
        </div>
      </main>

      {/* Patient Form Modal */}
      {showPatientForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          margin: 0,
          padding: 0
        }}>
          <PatientForm
            token={token}
            user={user}
            patientId={editingPatientId}
            onSave={handlePatientSave}
            onCancel={handleClosePatientForm}
            onClose={handleClosePatientForm}
          />
        </div>
      )}
    </div>
  );
};

export default SecretaryDashboard;
