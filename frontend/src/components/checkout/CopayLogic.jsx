import { useState, useEffect } from 'react';
import './CopayLogic.css';

const CopayLogic = ({ billingCodes, patient, totalAmount, setTotalAmount }) => {
  const [copayOverrides, setCopayOverrides] = useState({});
  const [insuranceCalculation, setInsuranceCalculation] = useState({
    coveredAmount: 0,
    copayAmount: 0,
    patientResponsibility: 0,
    insurancePayment: 0
  });

  useEffect(() => {
    calculateInsuranceCoverage();
  }, [billingCodes, patient, copayOverrides]);

  const calculateInsuranceCoverage = () => {
    if (!patient?.insurance || !billingCodes || billingCodes.length === 0) {
      setInsuranceCalculation({
        coveredAmount: 0,
        copayAmount: 0,
        patientResponsibility: totalAmount,
        insurancePayment: 0
      });
      return;
    }

    let totalCovered = 0;
    let totalCopay = 0;
    let totalPatientResponsibility = 0;
    let totalInsurancePayment = 0;

    billingCodes.forEach(code => {
      const codeTotal = code.price * (code.units || 1);
      const override = copayOverrides[code.code];
      
      if (override?.fullyCovered) {
        // Code is fully covered by insurance
        totalCovered += codeTotal;
        totalInsurancePayment += codeTotal;
      } else if (patient.insurance.copayRules) {
        // Check if there's a specific copay rule for this code
        const copayRule = patient.insurance.copayRules.find(rule => rule.billingCode === code.code);
        
        if (copayRule) {
          const copayPerUnit = copayRule.copayAmount || 0;
          const unitsCovered = Math.min(code.units || 1, copayRule.unitsCovered || 999);
          const codeCopay = copayPerUnit * unitsCovered;
          const codeInsurancePayment = codeTotal - codeCopay;
          
          totalCopay += codeCopay;
          totalInsurancePayment += Math.max(0, codeInsurancePayment);
          totalPatientResponsibility += codeCopay;
        } else {
          // No specific rule, apply general copay
          const generalCopay = patient.insurance.generalCopay || 0;
          totalCopay += Math.min(generalCopay, codeTotal);
          totalInsurancePayment += Math.max(0, codeTotal - generalCopay);
          totalPatientResponsibility += Math.min(generalCopay, codeTotal);
        }
      } else {
        // No insurance coverage
        totalPatientResponsibility += codeTotal;
      }
    });

    const calculation = {
      coveredAmount: totalCovered,
      copayAmount: totalCopay,
      patientResponsibility: totalPatientResponsibility,
      insurancePayment: totalInsurancePayment
    };

    setInsuranceCalculation(calculation);
    setTotalAmount(calculation.patientResponsibility);
  };

  const handleCopayOverride = (codeNumber, isFullyCovered) => {
    setCopayOverrides(prev => ({
      ...prev,
      [codeNumber]: {
        fullyCovered: isFullyCovered,
        overrideDate: new Date(),
        overrideBy: 'current-user' // Should be actual user ID
      }
    }));
  };

  const getInsuranceInfo = () => {
    if (!patient?.insurance) {
      return {
        provider: 'Self-Pay',
        policyNumber: 'N/A',
        groupNumber: 'N/A',
        status: 'uninsured'
      };
    }

    return {
      provider: patient.insurance.provider || 'Unknown',
      policyNumber: patient.insurance.policyNumber || 'N/A',
      groupNumber: patient.insurance.groupNumber || 'N/A',
      status: 'insured'
    };
  };

  const insuranceInfo = getInsuranceInfo();

  const getCoverageStatus = (code) => {
    const override = copayOverrides[code.code];
    if (override?.fullyCovered) return 'fully-covered';
    
    if (!patient?.insurance) return 'not-covered';
    
    const copayRule = patient.insurance.copayRules?.find(rule => rule.billingCode === code.code);
    if (copayRule) return 'partial-coverage';
    
    if (patient.insurance.generalCopay) return 'general-copay';
    
    return 'not-covered';
  };

  const getCoverageColor = (status) => {
    switch (status) {
      case 'fully-covered': return '#10b981';
      case 'partial-coverage': return '#f59e0b';
      case 'general-copay': return '#3b82f6';
      case 'not-covered': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCoverageLabel = (status) => {
    switch (status) {
      case 'fully-covered': return 'Fully Covered';
      case 'partial-coverage': return 'Partial Coverage';
      case 'general-copay': return 'General Copay';
      case 'not-covered': return 'Not Covered';
      default: return 'Unknown';
    }
  };

  return (
    <div className="checkout-section">
      <h3>💰 Insurance & Copay Logic</h3>
      
      <div className="insurance-info-card">
        <h4>🏥 Insurance Information</h4>
        <div className="insurance-details">
          <div className="insurance-row">
            <span className="label">Provider:</span>
            <span className="value">{insuranceInfo.provider}</span>
          </div>
          <div className="insurance-row">
            <span className="label">Policy #:</span>
            <span className="value">{insuranceInfo.policyNumber}</span>
          </div>
          <div className="insurance-row">
            <span className="label">Group #:</span>
            <span className="value">{insuranceInfo.groupNumber}</span>
          </div>
          <div className="insurance-row">
            <span className="label">Status:</span>
            <span className={`status ${insuranceInfo.status}`}>
              {insuranceInfo.status === 'insured' ? '✅ Insured' : '❌ Self-Pay'}
            </span>
          </div>
        </div>
      </div>

      {billingCodes.length > 0 && (
        <div className="copay-breakdown">
          <h4>💳 Coverage Breakdown by Code</h4>
          <div className="codes-coverage-list">
            {billingCodes.map((code, index) => {
              const coverageStatus = getCoverageStatus(code);
              const coverageColor = getCoverageColor(coverageStatus);
              const coverageLabel = getCoverageLabel(coverageStatus);
              const override = copayOverrides[code.code];
              
              return (
                <div key={index} className="code-coverage-item">
                  <div className="code-coverage-header">
                    <div className="code-info">
                      <span className="code-number">{code.code}</span>
                      <span className="code-desc">{code.description}</span>
                    </div>
                    <div 
                      className="coverage-status"
                      style={{ backgroundColor: coverageColor }}
                    >
                      {coverageLabel}
                    </div>
                  </div>
                  
                  <div className="code-coverage-details">
                    <div className="coverage-amounts">
                      <span>Total: ${(code.price * (code.units || 1)).toFixed(2)}</span>
                      {patient?.insurance && (
                        <>
                          <span>Insurance: ${(insuranceCalculation.insurancePayment / billingCodes.length).toFixed(2)}</span>
                          <span>Patient: ${(insuranceCalculation.patientResponsibility / billingCodes.length).toFixed(2)}</span>
                        </>
                      )}
                    </div>
                    
                    {patient?.insurance && (
                      <div className="copay-override">
                        <label className="override-label">
                          <input
                            type="checkbox"
                            checked={override?.fullyCovered || false}
                            onChange={(e) => handleCopayOverride(code.code, e.target.checked)}
                          />
                          Override: Fully covered by insurance
                        </label>
                        {override?.fullyCovered && (
                          <div className="override-alert">
                            ⚠️ Copay override applied - code fully covered
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {patient?.insurance && (
        <div className="insurance-calculation-summary">
          <h4>📊 Payment Summary</h4>
          <div className="calculation-grid">
            <div className="calc-item">
              <span className="calc-label">Total Services:</span>
              <span className="calc-value">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="calc-item">
              <span className="calc-label">Insurance Payment:</span>
              <span className="calc-value insurance">${insuranceCalculation.insurancePayment.toFixed(2)}</span>
            </div>
            <div className="calc-item">
              <span className="calc-label">Patient Copay:</span>
              <span className="calc-value copay">${insuranceCalculation.copayAmount.toFixed(2)}</span>
            </div>
            <div className="calc-item total">
              <span className="calc-label">Patient Responsibility:</span>
              <span className="calc-value">${insuranceCalculation.patientResponsibility.toFixed(2)}</span>
            </div>
          </div>
          
          {Object.keys(copayOverrides).some(key => copayOverrides[key].fullyCovered) && (
            <div className="override-summary">
              <h5>⚠️ Copay Overrides Applied</h5>
              <p>Some billing codes have been marked as fully covered by insurance. 
                 This override will be recorded in the audit trail.</p>
            </div>
          )}
        </div>
      )}

      {!patient?.insurance && (
        <div className="self-pay-notice">
          <div className="notice-content">
            <h4>💵 Self-Pay Patient</h4>
            <p>This patient does not have insurance on file. All charges will be patient responsibility.</p>
            <div className="self-pay-total">
              <span>Total Amount Due: </span>
              <span className="amount">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopayLogic;
