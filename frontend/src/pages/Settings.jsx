import { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ token, user }) => {
  const [clinicSettings, setClinicSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('clinicSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved clinic settings:', error);
      }
    }
    return {
      startTime: '09:00',
      endTime: '21:00',
      interval: 30,
      breakTimes: ['12:00-13:00'] // Default lunch break
    };
  });

  const [userPreferences, setUserPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      try {
        return JSON.parse(savedPrefs);
      } catch (error) {
        console.error('Error parsing user preferences:', error);
      }
    }
    return {
      theme: 'dark',
      notifications: true,
      autoRefresh: true,
      defaultView: 'calendar'
    };
  });

  const [activeTab, setActiveTab] = useState('clinic');

  // Save clinic settings
  const saveClinicSettings = () => {
    localStorage.setItem('clinicSettings', JSON.stringify(clinicSettings));
    alert('✅ Clinic settings saved successfully!');
  };

  // Save user preferences
  const saveUserPreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    alert('✅ User preferences saved successfully!');
  };

  // Reset to defaults
  const resetClinicSettings = () => {
    if (confirm('Are you sure you want to reset clinic settings to defaults?')) {
      const defaults = {
        startTime: '09:00',
        endTime: '21:00',
        interval: 30,
        breakTimes: ['12:00-13:00']
      };
      setClinicSettings(defaults);
      localStorage.setItem('clinicSettings', JSON.stringify(defaults));
      alert('✅ Settings reset to defaults!');
    }
  };

  const resetUserPreferences = () => {
    if (confirm('Are you sure you want to reset user preferences to defaults?')) {
      const defaults = {
        theme: 'dark',
        notifications: true,
        autoRefresh: true,
        defaultView: 'calendar'
      };
      setUserPreferences(defaults);
      localStorage.setItem('userPreferences', JSON.stringify(defaults));
      alert('✅ Preferences reset to defaults!');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Configure your clinic settings and preferences</p>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'clinic' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinic')}
        >
          🏥 Clinic Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          👤 User Preferences
        </button>
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          🖥️ System Info
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'clinic' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Clinic Schedule Settings</h2>
              <p>Configure your clinic's operating hours and break times</p>
            </div>

            <div className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time:</label>
                  <input 
                    type="time" 
                    value={clinicSettings.startTime}
                    onChange={(e) => setClinicSettings({...clinicSettings, startTime: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>End Time:</label>
                  <input 
                    type="time" 
                    value={clinicSettings.endTime}
                    onChange={(e) => setClinicSettings({...clinicSettings, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Time Interval (minutes):</label>
                <select 
                  value={clinicSettings.interval}
                  onChange={(e) => setClinicSettings({...clinicSettings, interval: parseInt(e.target.value)})}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Break Times (format: HH:MM-HH:MM, one per line):</label>
                <textarea 
                  value={clinicSettings.breakTimes.join('\n')}
                  onChange={(e) => setClinicSettings({
                    ...clinicSettings, 
                    breakTimes: e.target.value.split('\n').filter(line => line.trim())
                  })}
                  placeholder="12:00-13:00&#10;15:00-15:15"
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={saveClinicSettings}>
                  💾 Save Settings
                </button>
                <button className="btn-reset" onClick={resetClinicSettings}>
                  🔄 Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'user' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>User Preferences</h2>
              <p>Customize your personal experience</p>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Theme:</label>
                <select 
                  value={userPreferences.theme}
                  onChange={(e) => setUserPreferences({...userPreferences, theme: e.target.value})}
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default View:</label>
                <select 
                  value={userPreferences.defaultView}
                  onChange={(e) => setUserPreferences({...userPreferences, defaultView: e.target.value})}
                >
                  <option value="calendar">Calendar</option>
                  <option value="today">Today's Patients</option>
                  <option value="scheduler">Appointment Scheduler</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={userPreferences.notifications}
                    onChange={(e) => setUserPreferences({...userPreferences, notifications: e.target.checked})}
                  />
                  Enable Notifications
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={userPreferences.autoRefresh}
                    onChange={(e) => setUserPreferences({...userPreferences, autoRefresh: e.target.checked})}
                  />
                  Auto-refresh Data
                </label>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={saveUserPreferences}>
                  💾 Save Preferences
                </button>
                <button className="btn-reset" onClick={resetUserPreferences}>
                  🔄 Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>System Information</h2>
              <p>Application and user details</p>
            </div>

            <div className="system-info">
              <div className="info-card">
                <h3>👤 User Information</h3>
                <div className="info-item">
                  <span className="label">Name:</span>
                  <span className="value">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Role:</span>
                  <span className="value">{user?.role}</span>
                </div>
                <div className="info-item">
                  <span className="label">Clinic:</span>
                  <span className="value">{user?.clinicId?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>🖥️ Application</h3>
                <div className="info-item">
                  <span className="label">Version:</span>
                  <span className="value">SpineLine v1.0.0</span>
                </div>
                <div className="info-item">
                  <span className="label">Environment:</span>
                  <span className="value">Development</span>
                </div>
                <div className="info-item">
                  <span className="label">Last Updated:</span>
                  <span className="value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
