import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import PersonalInfoTab from './PatientForm/PersonalInfoTab';
import InsuranceTab from './PatientForm/InsuranceTab';
import DocumentsTab from './PatientForm/DocumentsTab';
import ReferralsTab from './PatientForm/ReferralsTab';
import AlertsTab from './PatientForm/AlertsTab';
import './PatientForm.css';

const PatientForm = ({ 
  token, 
  user, 
  patientId = null, // null for new patient, ID for editing
  onSave = null,
  onCancel = null,
  onClose = null 
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    preferredLanguage: 'English',
    patientType: 'Chiropractic',
    
    // Insurance Info
    insuranceInfo: [{
      companyName: '',
      policyNumber: '',
      groupId: '',
      copay: 0,
      expirationDate: '',
      coveredCodes: [{ code: '', unitsCovered: 0, patientPays: 0 }],
      isPrimary: true,
      isActive: true
    }],
    
    // Documents
    attachments: [],
    
    // Referrals
    referral: {
      referredBy: '',
      source: 'Patient',
      bonusPaid: false,
      referringDoctor: {
        name: '',
        phone: '',
        email: '',
        npi: ''
      }
    },
    
    // Alerts
    alerts: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // Load existing patient data if editing
  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && patientId) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, hasUnsavedChanges]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const patient = data.data.patient;
        
        // Transform patient data to match form structure
        setFormData({
          ...formData,
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
          phone: patient.phone || '',
          email: patient.email || '',
          gender: patient.gender || '',
          address: patient.address || formData.address,
          emergencyContact: patient.emergencyContact || formData.emergencyContact,
          preferredLanguage: patient.preferredLanguage || 'English',
          patientType: patient.patientType || 'Chiropractic',
          insuranceInfo: patient.insuranceInfo?.length > 0 ? patient.insuranceInfo : formData.insuranceInfo,
          attachments: patient.attachments || [],
          referral: patient.referral || formData.referral,
          alerts: patient.alerts || []
        });
      } else {
        setError('Failed to load patient data');
      }
    } catch (error) {
      console.error('Load patient error:', error);
      setError('Network error loading patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!patientId || saving) return;

    try {
      setSaving(true);
      await savePatient(false); // Silent save
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const savePatient = async (showNotification = true) => {
    try {
      const url = patientId 
        ? `${API_BASE_URL}/api/patients/${patientId}`
        : `${API_BASE_URL}/api/patients`;
      
      const method = patientId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (showNotification) {
          setSuccessMessage(patientId ? 'Patient updated successfully!' : 'Patient created successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
        
        if (onSave) {
          onSave(data.data.patient);
        }
        
        return data.data.patient;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save patient');
      }
    } catch (error) {
      if (showNotification) {
        setError(error.message);
        setTimeout(() => setError(''), 5000);
      }
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await savePatient();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const tabs = [
    { id: 'personal', label: '👤 Personal Info', component: PersonalInfoTab },
    { id: 'insurance', label: '🏥 Insurance', component: InsuranceTab },
    { id: 'documents', label: '📄 Documents', component: DocumentsTab },
    { id: 'referrals', label: '🔗 Referrals', component: ReferralsTab },
    { id: 'alerts', label: '⚠️ Alerts', component: AlertsTab }
  ];

  if (loading) {
    return (
      <div className="patient-form-loading">
        <div className="loading-spinner"></div>
        <p>Loading patient data...</p>
      </div>
    );
  }

  return (
    <div className="patient-form-container">
      <div className="patient-form-header">
        <h2>
          {patientId ? '✏️ Edit Patient' : '➕ New Patient'}
          {formData.firstName && formData.lastName && (
            <span className="patient-name"> - {formData.firstName} {formData.lastName}</span>
          )}
        </h2>
        
        <div className="form-actions">
          {hasUnsavedChanges && (
            <span className="unsaved-indicator">
              {saving ? '💾 Saving...' : '⚠️ Unsaved changes'}
            </span>
          )}
          
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : '💾 Save'}
          </button>
          
          {onCancel && (
            <button
              className="btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          
          {onClose && (
            <button
              className="btn-close"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="patient-form-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="patient-form-content">
        {tabs.map(tab => {
          const TabComponent = tab.component;
          return activeTab === tab.id ? (
            <TabComponent
              key={tab.id}
              formData={formData}
              updateFormData={updateFormData}
              token={token}
              user={user}
              patientId={patientId}
            />
          ) : null;
        })}
      </div>
    </div>
  );
};

export default PatientForm;
