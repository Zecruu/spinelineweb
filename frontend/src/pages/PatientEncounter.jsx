import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PatientHeader from '../components/doctor/PatientHeader';
import PatientHistoryDrawer from '../components/doctor/PatientHistoryDrawer';
import SOAPNoteEditor from '../components/doctor/SOAPNoteEditor';
import DiagnosesSection from '../components/doctor/DiagnosesSection';
import ProceduresSection from '../components/doctor/ProceduresSection';
import SpinalListings from '../components/doctor/SpinalListings';
import './PatientEncounter.css';

const PatientEncounter = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const activeTab = searchParams.get('tab') || 'soap';

  const [patient, setPatient] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [soapNote, setSoapNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchEncounterData();
  }, [patientId, appointmentId]);

  useEffect(() => {
    // Auto-save functionality
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && soapNote) {
        autoSaveSOAPNote();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, soapNote]);

  const fetchEncounterData = async () => {
    try {
      setLoading(true);
      const queryParams = appointmentId ? `?appointmentId=${appointmentId}` : '';
      
      const response = await fetch(`/api/doctor/encounter/${patientId}${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data.data.patient);
        setCurrentAppointment(data.data.currentAppointment);
        setSoapNote(data.data.currentSOAPNote || createNewSOAPNote());
      } else {
        console.error('Failed to fetch encounter data');
        navigate('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Error fetching encounter data:', error);
      navigate('/doctor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createNewSOAPNote = () => {
    return {
      appointmentId: appointmentId,
      patientId: patientId,
      subjective: {
        chiefComplaint: '',
        historyOfPresentIllness: '',
        painScale: null,
        painLocation: '',
        painQuality: '',
        aggravatingFactors: '',
        alleviatingFactors: '',
        reviewOfSystems: '',
        notes: ''
      },
      objective: {
        vitalSigns: {
          bloodPressure: '',
          heartRate: null,
          temperature: null,
          respiratoryRate: null,
          oxygenSaturation: null
        },
        physicalExam: {
          inspection: '',
          palpation: '',
          rangeOfMotion: '',
          neurologicalTests: '',
          orthopedicTests: ''
        },
        spinalListings: [],
        diagnosticTests: {
          xrays: '',
          mri: '',
          ctScan: '',
          other: ''
        },
        notes: ''
      },
      assessment: {
        primaryDiagnosis: { code: '', description: '' },
        secondaryDiagnoses: [],
        clinicalImpression: '',
        prognosis: 'Good',
        notes: ''
      },
      plan: {
        treatmentPlan: '',
        procedures: [],
        medications: [],
        homeExercises: '',
        restrictions: '',
        followUpInstructions: '',
        nextAppointment: {
          recommended: false,
          timeframe: '',
          notes: ''
        },
        notes: ''
      },
      isSigned: false,
      isComplete: false
    };
  };

  const autoSaveSOAPNote = async () => {
    if (!soapNote || !hasUnsavedChanges) return;

    try {
      setAutoSaveStatus('saving');
      
      const response = await fetch('/api/soap-notes/auto-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(soapNote)
      });

      if (response.ok) {
        setAutoSaveStatus('saved');
        setHasUnsavedChanges(false);
      } else {
        setAutoSaveStatus('error');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  };

  const updateSOAPNote = (section, data) => {
    setSoapNote(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
    setHasUnsavedChanges(true);
    setAutoSaveStatus('unsaved');
  };

  const handleSignAndComplete = async () => {
    try {
      const response = await fetch('/api/soap-notes/sign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...soapNote,
          isSigned: true,
          isComplete: true
        })
      });

      if (response.ok) {
        navigate('/doctor/dashboard');
      } else {
        console.error('Failed to sign SOAP note');
      }
    } catch (error) {
      console.error('Error signing SOAP note:', error);
    }
  };

  const getAutoSaveStatusColor = () => {
    switch (autoSaveStatus) {
      case 'saving': return '#f59e0b';
      case 'saved': return '#10b981';
      case 'error': return '#ef4444';
      case 'unsaved': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAutoSaveStatusText = () => {
    switch (autoSaveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'All changes saved';
      case 'error': return 'Save failed';
      case 'unsaved': return 'Unsaved changes';
      default: return 'Ready';
    }
  };

  if (loading) {
    return (
      <div className="encounter-loading">
        <div className="loading-spinner"></div>
        <p>Loading patient encounter...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="encounter-error">
        <h2>Patient not found</h2>
        <button onClick={() => navigate('/doctor/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="patient-encounter">
      <Sidebar
        user={{ name: 'Doctor', role: 'doctor', clinic: { name: 'SpineLine Clinic' } }}
        onLogout={() => navigate('/doctor/dashboard')}
        activeTab="encounter"
        userRole="doctor"
      />

      <div className="encounter-main-content">
        {/* Patient Header */}
        <PatientHeader 
          patient={patient}
          currentAppointment={currentAppointment}
          onShowHistory={() => setShowHistoryDrawer(true)}
        />

        {/* Main Encounter Content */}
        <div className="encounter-content">
          <div className="encounter-tabs">
            <button 
              className={`tab-btn ${activeTab === 'soap' ? 'active' : ''}`}
              onClick={() => navigate(`/doctor/encounter/${patientId}?tab=soap${appointmentId ? `&appointmentId=${appointmentId}` : ''}`)}
            >
              📝 SOAP Note
            </button>
            <button 
              className={`tab-btn ${activeTab === 'diagnoses' ? 'active' : ''}`}
              onClick={() => navigate(`/doctor/encounter/${patientId}?tab=diagnoses${appointmentId ? `&appointmentId=${appointmentId}` : ''}`)}
            >
              🩺 Diagnoses
            </button>
            <button 
              className={`tab-btn ${activeTab === 'procedures' ? 'active' : ''}`}
              onClick={() => navigate(`/doctor/encounter/${patientId}?tab=procedures${appointmentId ? `&appointmentId=${appointmentId}` : ''}`)}
            >
              🔧 Procedures
            </button>
            <button 
              className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => navigate(`/doctor/encounter/${patientId}?tab=listings${appointmentId ? `&appointmentId=${appointmentId}` : ''}`)}
            >
              🦴 Spinal Listings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'soap' && (
              <SOAPNoteEditor 
                soapNote={soapNote}
                onUpdate={updateSOAPNote}
                patient={patient}
              />
            )}
            
            {activeTab === 'diagnoses' && (
              <DiagnosesSection 
                diagnoses={soapNote?.assessment}
                onUpdate={(data) => updateSOAPNote('assessment', data)}
              />
            )}
            
            {activeTab === 'procedures' && (
              <ProceduresSection 
                procedures={soapNote?.plan?.procedures || []}
                onUpdate={(procedures) => updateSOAPNote('plan', { procedures })}
              />
            )}
            
            {activeTab === 'listings' && (
              <SpinalListings 
                listings={soapNote?.objective?.spinalListings || []}
                onUpdate={(spinalListings) => updateSOAPNote('objective', { spinalListings })}
              />
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="encounter-bottom-bar">
          <div className="auto-save-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getAutoSaveStatusColor() }}
            ></div>
            <span>{getAutoSaveStatusText()}</span>
          </div>

          <div className="encounter-actions">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/doctor/dashboard')}
            >
              Back to Dashboard
            </button>
            
            <button 
              className="btn-primary"
              onClick={handleSignAndComplete}
              disabled={!soapNote || soapNote.isSigned}
            >
              {soapNote?.isSigned ? '✅ Signed' : '✍️ Sign & Complete'}
            </button>
          </div>
        </div>
      </div>

      {/* Patient History Drawer */}
      {showHistoryDrawer && (
        <PatientHistoryDrawer 
          patientId={patientId}
          onClose={() => setShowHistoryDrawer(false)}
        />
      )}
    </div>
  );
};

export default PatientEncounter;
