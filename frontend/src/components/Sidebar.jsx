import { useState } from 'react';
import './DoctorSidebar.css';

const Sidebar = ({ user, onLogout, activeTab, setActiveTab, userRole = 'doctor' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getDoctorNavItems = () => [
    { id: 'patient-flow', label: '📋 Patient Flow', path: '/doctor/dashboard' },
    { id: 'schedule', label: '📅 Schedule', path: '/doctor/schedule' },
    { id: 'patients', label: '👥 Patients', path: '/doctor/patients' },
    { id: 'soap-notes', label: '📝 SOAP Notes', path: '/doctor/soap-notes' },
    { id: 'reports', label: '📊 Reports', path: '/doctor/reports' },
    { id: 'settings', label: '⚙️ Settings', path: '/doctor/settings' }
  ];

  const getSecretaryNavItems = () => [
    { id: 'todays-patients', label: '📋 Today\'s Patients', path: '/secretary/todays-patients' },
    { id: 'patients', label: '👥 Patient Management', path: '/secretary/patients' },
    { id: 'schedule', label: '📅 Schedule', path: '/secretary/schedule' },
    { id: 'ledger', label: '📊 Ledger', path: '/secretary/ledger' },
    { id: 'audit', label: '🔍 Audit', path: '/secretary/audit' },
    { id: 'settings', label: '⚙️ Settings', path: '/secretary/settings' }
  ];

  const navItems = userRole === 'doctor' ? getDoctorNavItems() : getSecretaryNavItems();

  const handleNavClick = (itemId) => {
    if (setActiveTab) {
      setActiveTab(itemId);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="doctor-sidebar-container">
      {/* Top Header with Hamburger */}
      <div className="doctor-top-header">
        <button
          className="doctor-hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="doctor-header-title">
          <h1>🏥 SpineLine</h1>
          <span className="clinic-name">{user?.clinic?.name}</span>
        </div>
        <div className="doctor-header-user">
          <div className="user-avatar">
            {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <span className="user-name">{user?.name || user?.username}</span>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="doctor-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`doctor-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="doctor-sidebar-header">
          <h1>🏥 SpineLine</h1>
          <div className="doctor-user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
            <div className="clinic-name">{user?.clinic?.name}</div>
          </div>
        </div>

        <nav className="doctor-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`doctor-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="doctor-sidebar-footer">
          <button onClick={onLogout} className="doctor-logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
