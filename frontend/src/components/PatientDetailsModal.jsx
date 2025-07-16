import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './PatientDetailsModal.css';

const PatientDetailsModal = ({ patient, isOpen, onClose, onSave, token }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [patientData, setPatientData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Insurance
    insurance: {
      primary: {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        subscriberName: '',
        subscriberId: '',
        copay: ''
      },
      secondary: {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        subscriberName: '',
        subscriberId: '',
        copay: ''
      }
    },
    
    // Referrals
    referrals: [],
    
    // Documents
    documents: [],
    
    // Alerts
    alerts: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient && isOpen) {
      loadPatientDetails();
    }
  }, [patient, isOpen]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData({
          ...data.data.patient,
          insurance: data.data.patient.insurance || {
            primary: { provider: '', policyNumber: '', groupNumber: '', subscriberName: '', subscriberId: '', copay: '' },
            secondary: { provider: '', policyNumber: '', groupNumber: '', subscriberName: '', subscriberId: '', copay: '' }
          },
          referrals: data.data.patient.referrals || [],
          documents: data.data.patient.documents || [],
          alerts: data.data.patient.alerts || []
        });
      } else {
        setError('Failed to load patient details');
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
      setError('Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value, section = null, subSection = null) => {
    setPatientData(prev => {
      if (section && subSection) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [subSection]: {
              ...prev[section][subSection],
              [field]: value
            }
          }
        };
      } else if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        const data = await response.json();
        onSave && onSave(data.data.patient);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save patient details');
      }
    } catch (error) {
      console.error('Error saving patient details:', error);
      setError('Failed to save patient details');
    } finally {
      setSaving(false);
    }
  };

  const addAlert = () => {
    setPatientData(prev => ({
      ...prev,
      alerts: [
        ...prev.alerts,
        {
          type: 'general',
          message: '',
          priority: 'medium',
          isActive: true,
          createdAt: new Date()
        }
      ]
    }));
  };

  const removeAlert = (index) => {
    setPatientData(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index)
    }));
  };

  const addReferral = () => {
    setPatientData(prev => ({
      ...prev,
      referrals: [
        ...prev.referrals,
        {
          source: '',
          doctorName: '',
          issuedDate: new Date().toISOString().split('T')[0],
          validDays: 90,
          notes: '',
          bonusAmount: 0,
          bonusPaid: false
        }
      ]
    }));
  };

  const removeReferral = (index) => {
    setPatientData(prev => ({
      ...prev,
      referrals: prev.referrals.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="patient-details-modal">
        <div className="modal-header">
          <h2>Patient Details - {patientData.firstName} {patientData.lastName}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`tab-btn ${activeTab === 'insurance' ? 'active' : ''}`}
            onClick={() => setActiveTab('insurance')}
          >
            Insurance
          </button>
          <button 
            className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            Referrals
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading patient details...</div>
          ) : (
            <>
              {activeTab === 'basic' && (
                <div className="tab-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={patientData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={patientData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={patientData.dateOfBirth ? patientData.dateOfBirth.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={patientData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={patientData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Address</label>
                      <input
                        type="text"
                        value={patientData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={patientData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={patientData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Zip Code</label>
                      <input
                        type="text"
                        value={patientData.zipCode || ''}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input
                        type="text"
                        value={patientData.emergencyContact || ''}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Emergency Phone</label>
                      <input
                        type="tel"
                        value={patientData.emergencyPhone || ''}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'insurance' && (
                <div className="tab-content">
                  <h3>Primary Insurance</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Provider</label>
                      <input
                        type="text"
                        value={patientData.insurance?.primary?.provider || ''}
                        onChange={(e) => handleInputChange('provider', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Policy Number</label>
                      <input
                        type="text"
                        value={patientData.insurance?.primary?.policyNumber || ''}
                        onChange={(e) => handleInputChange('policyNumber', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Group Number</label>
                      <input
                        type="text"
                        value={patientData.insurance?.primary?.groupNumber || ''}
                        onChange={(e) => handleInputChange('groupNumber', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscriber Name</label>
                      <input
                        type="text"
                        value={patientData.insurance?.primary?.subscriberName || ''}
                        onChange={(e) => handleInputChange('subscriberName', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscriber ID</label>
                      <input
                        type="text"
                        value={patientData.insurance?.primary?.subscriberId || ''}
                        onChange={(e) => handleInputChange('subscriberId', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Copay</label>
                      <input
                        type="number"
                        value={patientData.insurance?.primary?.copay || ''}
                        onChange={(e) => handleInputChange('copay', e.target.value, 'insurance', 'primary')}
                      />
                    </div>
                  </div>

                  <h3>Secondary Insurance</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Provider</label>
                      <input
                        type="text"
                        value={patientData.insurance?.secondary?.provider || ''}
                        onChange={(e) => handleInputChange('provider', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Policy Number</label>
                      <input
                        type="text"
                        value={patientData.insurance?.secondary?.policyNumber || ''}
                        onChange={(e) => handleInputChange('policyNumber', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Group Number</label>
                      <input
                        type="text"
                        value={patientData.insurance?.secondary?.groupNumber || ''}
                        onChange={(e) => handleInputChange('groupNumber', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscriber Name</label>
                      <input
                        type="text"
                        value={patientData.insurance?.secondary?.subscriberName || ''}
                        onChange={(e) => handleInputChange('subscriberName', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscriber ID</label>
                      <input
                        type="text"
                        value={patientData.insurance?.secondary?.subscriberId || ''}
                        onChange={(e) => handleInputChange('subscriberId', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                    <div className="form-group">
                      <label>Copay</label>
                      <input
                        type="number"
                        value={patientData.insurance?.secondary?.copay || ''}
                        onChange={(e) => handleInputChange('copay', e.target.value, 'insurance', 'secondary')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="tab-content">
                  <div className="section-header">
                    <h3>Referrals</h3>
                    <button className="btn-add" onClick={addReferral}>+ Add Referral</button>
                  </div>
                  {patientData.referrals?.map((referral, index) => (
                    <div key={index} className="referral-item">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Source</label>
                          <input
                            type="text"
                            value={referral.source || ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].source = e.target.value;
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Doctor Name</label>
                          <input
                            type="text"
                            value={referral.doctorName || ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].doctorName = e.target.value;
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Issued Date</label>
                          <input
                            type="date"
                            value={referral.issuedDate ? referral.issuedDate.split('T')[0] : ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].issuedDate = e.target.value;
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Valid Days</label>
                          <input
                            type="number"
                            value={referral.validDays || ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].validDays = parseInt(e.target.value);
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Bonus Amount</label>
                          <input
                            type="number"
                            value={referral.bonusAmount || ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].bonusAmount = parseFloat(e.target.value);
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Notes</label>
                          <textarea
                            value={referral.notes || ''}
                            onChange={(e) => {
                              const newReferrals = [...patientData.referrals];
                              newReferrals[index].notes = e.target.value;
                              setPatientData(prev => ({ ...prev, referrals: newReferrals }));
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn-remove" onClick={() => removeReferral(index)}>Remove</button>
                    </div>
                  ))}
                  {patientData.referrals?.length === 0 && (
                    <p className="no-data">No referrals added</p>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="tab-content">
                  <h3>Documents</h3>
                  <div className="documents-list">
                    {patientData.documents?.map((doc, index) => (
                      <div key={index} className="document-item">
                        <div className="doc-icon">📄</div>
                        <div className="doc-info">
                          <span className="doc-name">{doc.name}</span>
                          <span className="doc-date">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                        <button className="doc-download" onClick={() => window.open(doc.url, '_blank')}>
                          ⬇️
                        </button>
                      </div>
                    ))}
                    {patientData.documents?.length === 0 && (
                      <p className="no-data">No documents uploaded</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="tab-content">
                  <div className="section-header">
                    <h3>Alerts</h3>
                    <button className="btn-add" onClick={addAlert}>+ Add Alert</button>
                  </div>
                  {patientData.alerts?.map((alert, index) => (
                    <div key={index} className="alert-item">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Type</label>
                          <select
                            value={alert.type || 'general'}
                            onChange={(e) => {
                              const newAlerts = [...patientData.alerts];
                              newAlerts[index].type = e.target.value;
                              setPatientData(prev => ({ ...prev, alerts: newAlerts }));
                            }}
                          >
                            <option value="medical">Medical</option>
                            <option value="billing">Billing</option>
                            <option value="insurance">Insurance</option>
                            <option value="referral">Referral</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Priority</label>
                          <select
                            value={alert.priority || 'medium'}
                            onChange={(e) => {
                              const newAlerts = [...patientData.alerts];
                              newAlerts[index].priority = e.target.value;
                              setPatientData(prev => ({ ...prev, alerts: newAlerts }));
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label>Message</label>
                          <textarea
                            value={alert.message || ''}
                            onChange={(e) => {
                              const newAlerts = [...patientData.alerts];
                              newAlerts[index].message = e.target.value;
                              setPatientData(prev => ({ ...prev, alerts: newAlerts }));
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn-remove" onClick={() => removeAlert(index)}>Remove</button>
                    </div>
                  ))}
                  {patientData.alerts?.length === 0 && (
                    <p className="no-data">No alerts added</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
