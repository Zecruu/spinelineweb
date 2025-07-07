const AlertsTab = ({ formData, updateFormData, user }) => {
  const severityOptions = [
    { value: 'low', label: 'Info', color: '#3b82f6', icon: 'ℹ️' },
    { value: 'medium', label: 'Warning', color: '#f59e0b', icon: '⚠️' },
    { value: 'high', label: 'Urgent', color: '#ef4444', icon: '🚨' }
  ];

  const alertTypes = [
    'medical',
    'billing',
    'insurance',
    'referral',
    'general'
  ];

  const addAlert = () => {
    const newAlert = {
      type: 'general',
      message: '',
      priority: 'medium',
      isActive: true,
      createdBy: user?._id,
      createdAt: new Date().toISOString(),
      notes: ''
    };
    
    updateFormData({
      alerts: [...formData.alerts, newAlert]
    });
  };

  const removeAlert = (index) => {
    const updatedAlerts = formData.alerts.filter((_, i) => i !== index);
    updateFormData({ alerts: updatedAlerts });
  };

  const updateAlert = (index, field, value) => {
    const updatedAlerts = [...formData.alerts];
    updatedAlerts[index] = {
      ...updatedAlerts[index],
      [field]: value
    };
    updateFormData({ alerts: updatedAlerts });
  };

  const toggleAlertActive = (index) => {
    const updatedAlerts = [...formData.alerts];
    updatedAlerts[index] = {
      ...updatedAlerts[index],
      isActive: !updatedAlerts[index].isActive,
      resolvedAt: updatedAlerts[index].isActive ? new Date().toISOString() : null,
      resolvedBy: updatedAlerts[index].isActive ? user?._id : null
    };
    updateFormData({ alerts: updatedAlerts });
  };

  const getSeverityInfo = (priority) => {
    return severityOptions.find(option => option.value === priority) || severityOptions[1];
  };

  const getActiveAlertsCount = () => {
    return formData.alerts.filter(alert => alert.isActive).length;
  };

  return (
    <div className="alerts-tab">
      <div className="section-header">
        ⚠️ Patient Alerts
        {getActiveAlertsCount() > 0 && (
          <span className="active-alerts-badge">
            {getActiveAlertsCount()} Active
          </span>
        )}
      </div>
      
      <div className="alerts-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-number">{formData.alerts.length}</span>
            <span className="stat-label">Total Alerts</span>
          </div>
          <div className="stat-item">
            <span className="stat-number active">{getActiveAlertsCount()}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number resolved">{formData.alerts.length - getActiveAlertsCount()}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      <div className="alerts-list">
        {formData.alerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">🔔</div>
            <p>No alerts created yet.</p>
            <p className="no-alerts-hint">Add alerts to track important patient information.</p>
          </div>
        ) : (
          <div className="alerts-grid">
            {formData.alerts.map((alert, index) => {
              const severityInfo = getSeverityInfo(alert.priority);
              
              return (
                <div 
                  key={index} 
                  className={`alert-item ${alert.isActive ? 'active' : 'resolved'}`}
                >
                  <div className="alert-header">
                    <div className="alert-priority">
                      <span 
                        className="priority-indicator"
                        style={{ backgroundColor: severityInfo.color }}
                      >
                        {severityInfo.icon}
                      </span>
                      <span className="priority-label">{severityInfo.label}</span>
                    </div>
                    
                    <div className="alert-actions">
                      <button
                        type="button"
                        className={`toggle-alert-btn ${alert.isActive ? 'resolve' : 'reactivate'}`}
                        onClick={() => toggleAlertActive(index)}
                        title={alert.isActive ? 'Mark as resolved' : 'Reactivate alert'}
                      >
                        {alert.isActive ? '✓' : '↻'}
                      </button>
                      
                      <button
                        type="button"
                        className="remove-alert-btn"
                        onClick={() => removeAlert(index)}
                        title="Delete alert"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="alert-fields">
                    <div className="form-group">
                      <label>Alert Type</label>
                      <select
                        className="form-select"
                        value={alert.type}
                        onChange={(e) => updateAlert(index, 'type', e.target.value)}
                      >
                        {alertTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        className="form-select"
                        value={alert.priority}
                        onChange={(e) => updateAlert(index, 'priority', e.target.value)}
                      >
                        {severityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="required">Alert Message</label>
                    <input
                      type="text"
                      className="form-input"
                      value={alert.message}
                      onChange={(e) => updateAlert(index, 'message', e.target.value)}
                      placeholder="e.g., Balance Due, Medication Allergy, etc."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      className="form-textarea"
                      value={alert.notes}
                      onChange={(e) => updateAlert(index, 'notes', e.target.value)}
                      placeholder="Optional additional details about this alert"
                      rows="3"
                    />
                  </div>

                  <div className="alert-meta">
                    <div className="meta-item">
                      <span className="meta-label">Created:</span>
                      <span className="meta-value">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {alert.resolvedAt && (
                      <div className="meta-item">
                        <span className="meta-label">Resolved:</span>
                        <span className="meta-value">
                          {new Date(alert.resolvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-badge ${alert.isActive ? 'active' : 'resolved'}`}>
                        {alert.isActive ? 'Active' : 'Resolved'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <button
        type="button"
        className="add-item-btn"
        onClick={addAlert}
      >
        + Add New Alert
      </button>

      <style jsx>{`
        .active-alerts-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: 1rem;
        }
        
        .alerts-summary {
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(51, 65, 85, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .summary-stats {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #f1f5f9;
        }
        
        .stat-number.active {
          color: #ef4444;
        }
        
        .stat-number.resolved {
          color: #22c55e;
        }
        
        .stat-label {
          display: block;
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .alerts-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .alert-item {
          background: rgba(51, 65, 85, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .alert-item.resolved {
          opacity: 0.7;
          background: rgba(51, 65, 85, 0.3);
        }
        
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .alert-priority {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .priority-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          font-size: 1rem;
        }
        
        .priority-label {
          color: #f1f5f9;
          font-weight: 600;
        }
        
        .alert-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .toggle-alert-btn, .remove-alert-btn {
          width: 2rem;
          height: 2rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        
        .toggle-alert-btn.resolve {
          background: rgba(34, 197, 94, 0.8);
          color: white;
        }
        
        .toggle-alert-btn.reactivate {
          background: rgba(59, 130, 246, 0.8);
          color: white;
        }
        
        .remove-alert-btn {
          background: rgba(239, 68, 68, 0.8);
          color: white;
        }
        
        .alert-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .alert-meta {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          flex-wrap: wrap;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .meta-label {
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .meta-value {
          color: #f1f5f9;
          font-size: 0.8rem;
        }
        
        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-badge.active {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        
        .status-badge.resolved {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }
        
        .no-alerts {
          text-align: center;
          padding: 3rem;
          color: rgba(241, 245, 249, 0.7);
        }
        
        .no-alerts-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .no-alerts-hint {
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .summary-stats {
            flex-direction: column;
            gap: 1rem;
          }
          
          .alert-fields {
            grid-template-columns: 1fr;
          }
          
          .alert-meta {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AlertsTab;
