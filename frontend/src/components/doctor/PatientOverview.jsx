import React, { useState, useEffect } from 'react';
import './PatientOverview.css';

const PatientOverview = ({ patient, appointment, token }) => {
  const [patientHistory, setPatientHistory] = useState([]);
  const [activePackages, setActivePackages] = useState([]);
  const [providerNotes, setProviderNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [painScaleHistory, setPainScaleHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patient._id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPatientHistory(),
        loadActivePackages(),
        loadProviderNotes(),
        loadDocuments(),
        loadPainScaleHistory()
      ]);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientHistory = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatientHistory(data.slice(0, 5)); // Show last 5 visits
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
    }
  };

  const loadActivePackages = async () => {
    try {
      const response = await fetch(`/api/care-packages/patient/${patient._id}/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivePackages(data);
      }
    } catch (error) {
      console.error('Error loading active packages:', error);
    }
  };

  const loadProviderNotes = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}/provider-notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProviderNotes(data.slice(0, 3)); // Show last 3 notes
      }
    } catch (error) {
      console.error('Error loading provider notes:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadPainScaleHistory = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}/pain-scale-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPainScaleHistory(data.slice(0, 10)); // Show last 10 entries
      }
    } catch (error) {
      console.error('Error loading pain scale history:', error);
    }
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('patientId', patient._id);
      formData.append('appointmentId', appointment._id);

      const response = await fetch('/api/patients/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        await loadDocuments(); // Refresh documents list
        event.target.value = ''; // Clear file input
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPainScaleColor = (scale) => {
    if (scale <= 3) return '#22c55e'; // Green
    if (scale <= 6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  if (loading) {
    return (
      <div className="patient-overview loading">
        <div className="loading-spinner"></div>
        <p>Loading patient overview...</p>
      </div>
    );
  }

  return (
    <div className="patient-overview">
      {/* Patient Basic Info */}
      <div className="overview-section patient-info">
        <h3>Patient Information</h3>
        <div className="patient-details">
          <div className="patient-avatar">
            <div className="avatar-circle">
              {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
            </div>
          </div>
          <div className="patient-basic-info">
            <h4>{patient.firstName} {patient.lastName}</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">DOB:</span>
                <span className="value">{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Age:</span>
                <span className="value">{calculateAge(patient.dateOfBirth)}</span>
              </div>
              <div className="info-item">
                <span className="label">Record #:</span>
                <span className="value">{patient.recordNumber || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone:</span>
                <span className="value">{patient.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Care Packages */}
      <div className="overview-section care-packages">
        <h3>Active Care Packages</h3>
        {activePackages.length > 0 ? (
          <div className="packages-list">
            {activePackages.map(pkg => (
              <div key={pkg._id} className="package-item">
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-sessions">{pkg.remainingSessions}/{pkg.totalSessions} sessions</span>
                </div>
                <div className="package-progress">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${((pkg.totalSessions - pkg.remainingSessions) / pkg.totalSessions) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No active care packages</p>
        )}
      </div>

      {/* Pain Scale Progression */}
      <div className="overview-section pain-scale">
        <h3>Pain Scale Progression</h3>
        {painScaleHistory.length > 0 ? (
          <div className="pain-scale-chart">
            {painScaleHistory.map((entry, index) => (
              <div key={index} className="pain-entry">
                <div className="pain-date">{formatDate(entry.date)}</div>
                <div className="pain-scale-bar">
                  <div 
                    className="pain-level"
                    style={{ 
                      width: `${(entry.scale / 10) * 100}%`,
                      backgroundColor: getPainScaleColor(entry.scale)
                    }}
                  >
                    {entry.scale}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No pain scale history available</p>
        )}
      </div>

      {/* Provider Notes */}
      <div className="overview-section provider-notes">
        <h3>Recent Provider Notes</h3>
        {providerNotes.length > 0 ? (
          <div className="notes-list">
            {providerNotes.map(note => (
              <div key={note._id} className="note-item">
                <div className="note-header">
                  <span className="note-date">{formatDate(note.date)}</span>
                  <span className="note-provider">{note.providerName}</span>
                </div>
                <p className="note-content">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No provider notes available</p>
        )}
      </div>

      {/* Patient History */}
      <div className="overview-section patient-history">
        <h3>Recent Visit History</h3>
        {patientHistory.length > 0 ? (
          <div className="history-list">
            {patientHistory.map(visit => (
              <div key={visit._id} className="history-item">
                <div className="visit-date">{formatDate(visit.date)}</div>
                <div className="visit-type">{visit.visitType}</div>
                <div className="visit-status">{visit.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No visit history available</p>
        )}
      </div>

      {/* Documents Section */}
      <div className="overview-section documents">
        <h3>Documents</h3>
        <div className="documents-header">
          <label className="upload-btn">
            <input
              type="file"
              onChange={handleDocumentUpload}
              disabled={uploadingDocument}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {uploadingDocument ? 'Uploading...' : '📎 Upload Document'}
          </label>
        </div>
        {documents.length > 0 ? (
          <div className="documents-list">
            {documents.map(doc => (
              <div key={doc._id} className="document-item">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-date">{formatDate(doc.uploadDate)}</span>
                </div>
                <button className="doc-download" onClick={() => window.open(doc.url, '_blank')}>
                  ⬇️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No documents uploaded</p>
        )}
      </div>
    </div>
  );
};

export default PatientOverview;
