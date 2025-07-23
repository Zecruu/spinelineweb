import React, { useState, useEffect } from 'react';
import './PatientOverview.css';
import { API_BASE_URL } from '../../config/api';

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
      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}/history`, {
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
      const response = await fetch(`${API_BASE_URL}/api/care-packages/patient/${patient._id}/active`, {
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
      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}/provider-notes`, {
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
      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}/documents`, {
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
      const response = await fetch(`${API_BASE_URL}/api/patients/${patient._id}/pain-scale-history`, {
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
    <div className="patient-overview-redesigned">
      {/* Patient Information Card */}
      <div className="overview-card patient-info-card">
        <div className="card-header">
          <h3>🧑‍⚕️ Patient Information</h3>
        </div>
        <div className="card-content">
          <div className="patient-profile">
            <div className="patient-avatar-large">
              <div className="avatar-circle-large">
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
              </div>
            </div>
            <div className="patient-details-grid">
              <div className="patient-name-section">
                <h4 className="patient-full-name">{patient.firstName} {patient.lastName}</h4>
                <span className="patient-record">DOB: N/A</span>
              </div>
              <div className="patient-meta-info">
                <div className="meta-item">
                  <span className="meta-label">Age</span>
                  <span className="meta-value">N/A</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Record #</span>
                  <span className="meta-value">{patient.recordNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Care Packages Card */}
      <div className="overview-card care-packages-card">
        <div className="card-header">
          <h3>🔴 Active Care Packages</h3>
        </div>
        <div className="card-content">
          {activePackages.length > 0 ? (
            <div className="care-packages-list">
              {activePackages.map(pkg => (
                <div key={pkg._id} className="care-package-item">
                  <div className="package-status-indicator active"></div>
                  <div className="package-details">
                    <div className="package-header">
                      <span className="package-name">{pkg.name || 'Laser Therapy'}</span>
                      <span className="package-status-badge active">Active</span>
                    </div>
                    <div className="package-sessions">
                      <span className="sessions-text">Sessions Used</span>
                      <div className="sessions-progress">
                        <div className="sessions-bar">
                          <div
                            className="sessions-fill"
                            style={{
                              width: `${((pkg.totalSessions - pkg.remainingSessions) / pkg.totalSessions) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="sessions-count">
                          {pkg.totalSessions - pkg.remainingSessions}/{pkg.totalSessions}
                        </span>
                      </div>
                    </div>
                    <div className="package-dates">
                      <div className="date-item">
                        <span className="date-label">Started</span>
                        <span className="date-value">{formatDate(pkg.startDate) || 'Dec 19, 2024'}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Expires</span>
                        <span className="date-value">{formatDate(pkg.endDate) || 'Mar 19, 2025'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-packages">
              <div className="no-packages-icon">📦</div>
              <p>No active care packages</p>
            </div>
          )}
        </div>
      </div>

      {/* Pain Scale Progression Card */}
      <div className="overview-card pain-scale-card">
        <div className="card-header">
          <h3>📊 Pain Scale Progression</h3>
        </div>
        <div className="card-content">
          <div className="pain-scale-timeline">
            {/* Timeline entries with color-coded indicators */}
            <div className="timeline-entry">
              <div className="timeline-date">Jul 14, 2025</div>
              <div className="timeline-indicator red"></div>
            </div>
            <div className="timeline-entry">
              <div className="timeline-date">Jul 7, 2025</div>
              <div className="timeline-indicator orange"></div>
            </div>
            <div className="timeline-entry">
              <div className="timeline-date">Jun 30, 2025</div>
              <div className="timeline-indicator yellow"></div>
            </div>
            <div className="timeline-entry">
              <div className="timeline-date">Jun 23, 2025</div>
              <div className="timeline-indicator green"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Visit History Card */}
      <div className="overview-card visit-history-card">
        <div className="card-header">
          <h3>📋 Record Visit History</h3>
        </div>
        <div className="card-content">
          {patientHistory.length > 0 ? (
            <div className="visit-history-list">
              {patientHistory.map((visit, index) => (
                <div key={visit._id || index} className="visit-entry">
                  <div className="visit-date">{formatDate(visit.date)}</div>
                  <div className="visit-status completed">Completed</div>
                  <div className="visit-details">
                    <div className="visit-type">{visit.visitType || 'Chiropractic Tx'}</div>
                    <div className="visit-provider">{visit.providerName || 'Morales Emmanuelli, Alvin A.'}</div>
                    <div className="visit-note">No Room Scheduled</div>
                  </div>
                  <div className="visit-provider-name">Dra. Alvin Morales Quiropráctica</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-visits">
              <div className="no-visits-icon">📅</div>
              <p>No visit history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Card */}
      <div className="overview-card documents-card">
        <div className="card-header">
          <h3>📄 Documents</h3>
        </div>
        <div className="card-content">
          {documents.length > 0 ? (
            <div className="documents-list">
              {documents.map(doc => (
                <div key={doc._id} className="document-item">
                  <div className="document-icon">📄</div>
                  <div className="document-details">
                    <div className="document-name">{doc.originalName}</div>
                    <div className="document-meta">
                      {formatDate(doc.uploadDate)} • {(doc.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button className="document-download-btn">⬇️</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-documents">
              <div className="no-documents-icon">📄</div>
              <p>No documents uploaded</p>
            </div>
          )}

          <div className="upload-document-section">
            <button
              className="upload-document-btn"
              onClick={() => document.getElementById('document-upload').click()}
              disabled={uploadingDocument}
            >
              {uploadingDocument ? '⏳ Uploading...' : '📤 Upload Document'}
            </button>
            <input
              id="document-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={handleDocumentUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
