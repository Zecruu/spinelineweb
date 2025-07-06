import { useState, useEffect } from 'react';
import './SecretaryDashboard.css';

const SecretaryDashboard = ({ token, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);

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

      const response = await fetch(`http://localhost:5001/api/patients?${queryParams}`, {
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
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search patients by name, record number, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍 Search
            </button>
          </div>
        </form>
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
                        <button className="btn-action btn-view" title="View Patient">
                          👁️
                        </button>
                        <button className="btn-action btn-edit" title="Edit Patient">
                          ✏️
                        </button>
                        <button className="btn-action btn-delete" title="Delete Patient">
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
      <aside className="sidebar">
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
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            👥 Patient Management
          </button>
          <button 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 Appointments
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
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-info">
            <h1>Welcome back, {user.name}!</h1>
            <p>Manage your clinic's patients and appointments</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{totalPatients}</div>
              <div className="stat-label">Total Patients</div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'patients' && renderPatientManagement()}
          {activeTab === 'appointments' && (
            <div className="coming-soon">
              <h2>📅 Appointments</h2>
              <p>Appointment management coming soon...</p>
            </div>
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
        </div>
      </main>
    </div>
  );
};

export default SecretaryDashboard;
