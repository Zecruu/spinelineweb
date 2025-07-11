import { useState } from 'react';
import './PatientHeader.css';

const PatientHeader = ({ patient, currentAppointment, onShowHistory }) => {
  const [showInsuranceDetails, setShowInsuranceDetails] = useState(false);

  const getInsuranceInfo = () => {
    if (!patient?.insuranceInfo || patient.insuranceInfo.length === 0) {
      return {
        provider: 'Self-Pay',
        status: 'uninsured',
        copay: 0,
        coveredCodes: []
      };
    }

    const primaryInsurance = patient.insuranceInfo.find(ins => ins.isPrimary && ins.isActive) ||
                            patient.insuranceInfo.find(ins => ins.isActive) ||
                            patient.insuranceInfo[0];

    return {
      provider: primaryInsurance.companyName || 'Unknown',
      status: 'insured',
      copay: primaryInsurance.copay || 0,
      coveredCodes: primaryInsurance.coveredBillingCodes || [],
      policyNumber: primaryInsurance.policyNumber,
      groupId: primaryInsurance.groupId
    };
  };

  const getPatientAge = () => {
    if (!patient?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPatientType = () => {
    if (currentAppointment?.visitType) {
      return currentAppointment.visitType;
    }
    
    // Determine based on patient history or other factors
    if (patient?.referral?.source === 'MD') {
      return 'Medical Referral';
    }
    
    return 'Standard';
  };

  const insuranceInfo = getInsuranceInfo();

  return (
    <div className="patient-header">
      {/* Left Section: Insurance & Coverage */}
      <div className="header-section insurance-section">
        <h3>🏥 Insurance & Coverage</h3>
        <div className="insurance-info">
          <div className="insurance-provider">
            <span className="label">Provider:</span>
            <span className={`value ${insuranceInfo.status}`}>
              {insuranceInfo.provider}
            </span>
          </div>
          
          {insuranceInfo.status === 'insured' && (
            <>
              <div className="copay-info">
                <span className="label">Copay:</span>
                <span className="value copay">${insuranceInfo.copay.toFixed(2)}</span>
              </div>
              
              <div className="covered-codes">
                <span className="label">Covered Codes:</span>
                <div className="codes-list">
                  {insuranceInfo.coveredCodes.length > 0 ? (
                    insuranceInfo.coveredCodes.slice(0, 3).map((code, index) => (
                      <span key={index} className="code-badge covered">
                        {code}
                      </span>
                    ))
                  ) : (
                    <span className="no-codes">No codes specified</span>
                  )}
                  {insuranceInfo.coveredCodes.length > 3 && (
                    <span className="more-codes">
                      +{insuranceInfo.coveredCodes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                className="details-btn"
                onClick={() => setShowInsuranceDetails(!showInsuranceDetails)}
              >
                {showInsuranceDetails ? 'Hide' : 'Show'} Details
              </button>
              
              {showInsuranceDetails && (
                <div className="insurance-details">
                  <div className="detail-row">
                    <span className="label">Policy #:</span>
                    <span className="value">{insuranceInfo.policyNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Group ID:</span>
                    <span className="value">{insuranceInfo.groupId || 'N/A'}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Middle Section: Patient Overview */}
      <div className="header-section patient-section">
        <div className="patient-overview">
          <div className="patient-photo">
            <div className="photo-placeholder">
              {patient?.firstName?.[0]}{patient?.lastName?.[0]}
            </div>
          </div>
          
          <div className="patient-info">
            <h2 className="patient-name">
              {patient?.firstName} {patient?.lastName}
            </h2>
            <div className="patient-details">
              <span className="age">Age: {getPatientAge()}</span>
              <span className="record-number">#{patient?.recordNumber}</span>
              <span className="patient-type">{getPatientType()}</span>
            </div>
            
            {patient?.alerts && patient.alerts.length > 0 && (
              <div className="patient-alerts">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">
                  {patient.alerts.length} alert{patient.alerts.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Quick History */}
      <div className="header-section history-section">
        <h3>📋 Quick History</h3>
        <div className="quick-history">
          <div className="history-summary">
            <div className="last-visit">
              <span className="label">Last Visit:</span>
              <span className="value">
                {currentAppointment?.appointmentDate ? 
                  new Date(currentAppointment.appointmentDate).toLocaleDateString() : 
                  'N/A'
                }
              </span>
            </div>
            
            <div className="visit-count">
              <span className="label">Total Visits:</span>
              <span className="value">--</span>
            </div>
            
            <div className="last-pain-scale">
              <span className="label">Last Pain Scale:</span>
              <span className="value">--/10</span>
            </div>
          </div>
          
          <button 
            className="view-history-btn"
            onClick={onShowHistory}
          >
            📊 View Full History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
