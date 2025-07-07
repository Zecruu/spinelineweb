import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import Settings from './Settings';
import './AdminDashboard.css';

const AdminDashboard = ({ token, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clinic creation form
  const [clinicForm, setClinicForm] = useState({
    name: '',
    clinicCode: ''
  });

  // User creation form
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'doctor',
    clinicCode: '',
    firstName: '',
    lastName: ''
  });

  const [clinics, setClinics] = useState([]);
  const [clinicUsers, setClinicUsers] = useState([]);
  const [selectedClinicData, setSelectedClinicData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        // Clear invalid token
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setTimeout(() => onLogout(), 2000);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics
  const fetchClinics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/clinics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClinics(data.data.clinics);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setTimeout(() => onLogout(), 2000);
      }
    } catch (error) {
      console.error('Fetch clinics error:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchClinics();
  }, [token]);

  // Handle clinic creation
  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/clinics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clinicForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Clinic created successfully! Code: ${data.data.clinic.clinicCode}`);
        setClinicForm({ name: '', clinicCode: '' });
        fetchDashboard();
        fetchClinics();
      } else {
        setError(data.message || 'Failed to create clinic');
      }
    } catch (error) {
      console.error('Create clinic error:', error);
      setError('Network error creating clinic');
    } finally {
      setLoading(false);
    }
  };

  // Handle user creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const userData = {
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        clinicCode: userForm.clinicCode,
        profile: {
          firstName: userForm.firstName,
          lastName: userForm.lastName
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`User created successfully for ${data.data.user.clinicName}!`);
        setUserForm({
          username: '',
          email: '',
          password: '',
          role: 'doctor',
          clinicCode: '',
          firstName: '',
          lastName: ''
        });
        fetchDashboard();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      setError('Network error creating user');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <h2>📊 Dashboard Overview</h2>
      
      {dashboardData && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Clinics</h3>
            <div className="stat-number">{dashboardData.stats.totalClinics}</div>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-number">{dashboardData.stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <h3>Active Clinics</h3>
            <div className="stat-number">{dashboardData.stats.activeClinics}</div>
          </div>
        </div>
      )}

      {dashboardData?.recentClinics && (
        <div className="recent-clinics">
          <h3>Recent Clinics</h3>
          <div className="clinics-list">
            {dashboardData.recentClinics.map(clinic => (
              <div key={clinic._id} className="clinic-item">
                <div className="clinic-info">
                  <strong>{clinic.name || 'Unnamed Clinic'}</strong>
                  <span className="clinic-code">Code: {clinic.clinicCode}</span>
                </div>
                <div className="clinic-status">
                  <span className={`status ${clinic.isActive ? 'active' : 'inactive'}`}>
                    {clinic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCreateClinic = () => (
    <div className="form-content">
      <h2>🏥 Create New Clinic</h2>
      
      <form onSubmit={handleCreateClinic} className="admin-form">
        <div className="form-group">
          <label htmlFor="clinicName">Clinic Name *</label>
          <input
            type="text"
            id="clinicName"
            value={clinicForm.name}
            onChange={(e) => setClinicForm({...clinicForm, name: e.target.value})}
            required
            placeholder="Enter clinic name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="clinicCode">Clinic Code (Optional)</label>
          <input
            type="text"
            id="clinicCode"
            value={clinicForm.clinicCode}
            onChange={(e) => setClinicForm({...clinicForm, clinicCode: e.target.value.toUpperCase()})}
            placeholder="Leave empty to auto-generate"
            maxLength="10"
            disabled={loading}
          />
          <small>3-10 characters, letters and numbers only. Leave empty to auto-generate.</small>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Clinic'}
        </button>
      </form>
    </div>
  );

  const renderCreateUser = () => (
    <div className="form-content">
      <h2>👤 Create New User</h2>
      
      <form onSubmit={handleCreateUser} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              value={userForm.firstName}
              onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              value={userForm.lastName}
              onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            value={userForm.username}
            onChange={(e) => setUserForm({...userForm, username: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            value={userForm.email}
            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            value={userForm.password}
            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
            required
            minLength="6"
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              value={userForm.role}
              onChange={(e) => setUserForm({...userForm, role: e.target.value})}
              disabled={loading}
            >
              <option value="doctor">Doctor</option>
              <option value="secretary">Secretary</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="userClinicCode">Clinic Code *</label>
            <input
              type="text"
              id="userClinicCode"
              value={userForm.clinicCode}
              onChange={(e) => setUserForm({...userForm, clinicCode: e.target.value.toUpperCase()})}
              required
              placeholder="Enter clinic code"
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>

      {clinics.length > 0 && (
        <div className="available-clinics">
          <h3>Available Clinic Codes:</h3>
          <div className="clinic-codes">
            {clinics.map(clinic => (
              <span key={clinic._id} className="clinic-code-badge">
                {clinic.clinicCode}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderManageClinics = () => (
    <div className="manage-content">
      <h2>🏢 Manage Clinics</h2>

      <div className="clinics-table">
        {clinics.length > 0 ? (
          <div className="table-container">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">Clinic Name</div>
                <div className="table-cell">Clinic Code</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Created</div>
              </div>
            </div>
            <div className="table-body">
              {clinics.map(clinic => (
                <div key={clinic._id} className="table-row">
                  <div className="table-cell">
                    <strong>{clinic.name || 'Unnamed Clinic'}</strong>
                  </div>
                  <div className="table-cell">
                    <span className="clinic-code-badge">{clinic.clinicCode}</span>
                  </div>
                  <div className="table-cell">{clinic.contact?.email || 'No email'}</div>
                  <div className="table-cell">
                    <span className={`status ${clinic.isActive ? 'active' : 'inactive'}`}>
                      {clinic.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="table-cell">
                    {new Date(clinic.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No clinics found</h3>
            <p>Create your first clinic to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderManageUsers = () => (
    <div className="manage-content">
      <h2>👥 Manage Users</h2>

      <div className="users-section">
        <div className="clinic-selector">
          <label htmlFor="clinicSelect">Select Clinic:</label>
          <select
            id="clinicSelect"
            onChange={(e) => {
              if (e.target.value) {
                // Fetch users for selected clinic
                fetchUsersForClinic(e.target.value);
              }
            }}
          >
            <option value="">Choose a clinic...</option>
            {clinics.map(clinic => (
              <option key={clinic._id} value={clinic.clinicCode}>
                {clinic.name} ({clinic.clinicCode})
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="loading">Loading users...</div>}

        {error && <div className="error-message">{error}</div>}

        {!loading && !error && clinicUsers.length === 0 && !selectedClinicData && (
          <div className="empty-state">
            <h3>Select a clinic to view users</h3>
            <p>Choose a clinic from the dropdown above to see its users.</p>
          </div>
        )}

        {!loading && !error && selectedClinicData && (
          <div className="users-section">
            <div className="section-header">
              <h3>👥 Users for {selectedClinicData.name}</h3>
              <span className="clinic-code">Clinic Code: {selectedClinicData.clinicCode}</span>
            </div>

            {clinicUsers.length === 0 ? (
              <div className="empty-state">
                <h4>No users found</h4>
                <p>This clinic doesn't have any users yet.</p>
              </div>
            ) : (
              <div className="users-grid">
                {clinicUsers.map(user => (
                  <div key={user._id} className="user-card">
                    <div className="user-header">
                      <h4>{user.name || user.username}</h4>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                    <div className="user-details">
                      <p><strong>Email:</strong> {user.email}</p>
                      {user.username && <p><strong>Username:</strong> {user.username}</p>}
                      <p><strong>Status:</strong>
                        <span className={user.isActive ? 'status-active' : 'status-inactive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      {user.lastLogin && (
                        <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleDateString()}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const fetchUsersForClinic = async (clinicCode) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/admin/clinics/${clinicCode}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Users for clinic:', data);
        setClinicUsers(data.data.users);
        setSelectedClinicData(data.data.clinic);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setTimeout(() => onLogout(), 2000);
      } else {
        setError('Failed to fetch clinic users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to fetch clinic users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>🏥 SpineLine Admin Portal</h1>
          <span className="user-info">Welcome, {user.email}</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              setError('');
              fetchDashboard();
              fetchClinics();
            }}
            className="refresh-button"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <button
          className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-button ${activeTab === 'create-clinic' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-clinic')}
        >
          🏥 Create Clinic
        </button>
        <button
          className={`nav-button ${activeTab === 'create-user' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-user')}
        >
          👤 Create User
        </button>
        <button
          className={`nav-button ${activeTab === 'manage-clinics' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage-clinics')}
        >
          🏢 Manage Clinics
        </button>
        <button
          className={`nav-button ${activeTab === 'manage-users' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage-users')}
        >
          👥 Manage Users
        </button>
        <button
          className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="admin-main">
        {error && (
          <div className="error-message">
            <div>
              <strong>Error:</strong> {error}
              {error.includes('Session expired') && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  You will be redirected to login automatically.
                </div>
              )}
            </div>
            <button onClick={() => setError('')} className="close-button">×</button>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
            <button onClick={() => setSuccessMessage('')} className="close-button">×</button>
          </div>
        )}

        {loading && <div className="loading">Loading...</div>}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'create-clinic' && renderCreateClinic()}
        {activeTab === 'create-user' && renderCreateUser()}
        {activeTab === 'manage-clinics' && renderManageClinics()}
        {activeTab === 'manage-users' && renderManageUsers()}
        {activeTab === 'settings' && (
          <Settings token={token} user={user} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
