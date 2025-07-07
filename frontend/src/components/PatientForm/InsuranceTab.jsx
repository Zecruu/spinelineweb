const InsuranceTab = ({ formData, updateFormData }) => {
  const handleInsuranceChange = (index, field, value) => {
    const updatedInsurance = [...formData.insuranceInfo];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedInsurance[index] = {
        ...updatedInsurance[index],
        [parent]: {
          ...updatedInsurance[index][parent],
          [child]: value
        }
      };
    } else {
      updatedInsurance[index] = {
        ...updatedInsurance[index],
        [field]: value
      };
    }
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  const handleCoveredCodeChange = (insuranceIndex, codeIndex, field, value) => {
    const updatedInsurance = [...formData.insuranceInfo];
    const updatedCodes = [...updatedInsurance[insuranceIndex].coveredCodes];
    updatedCodes[codeIndex] = {
      ...updatedCodes[codeIndex],
      [field]: value
    };
    updatedInsurance[insuranceIndex] = {
      ...updatedInsurance[insuranceIndex],
      coveredCodes: updatedCodes
    };
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  const addCoveredCode = (insuranceIndex) => {
    const updatedInsurance = [...formData.insuranceInfo];
    updatedInsurance[insuranceIndex].coveredCodes.push({
      code: '',
      unitsCovered: 0,
      patientPays: 0
    });
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  const removeCoveredCode = (insuranceIndex, codeIndex) => {
    const updatedInsurance = [...formData.insuranceInfo];
    updatedInsurance[insuranceIndex].coveredCodes.splice(codeIndex, 1);
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  const addInsurance = () => {
    const newInsurance = {
      companyName: '',
      policyNumber: '',
      groupId: '',
      copay: 0,
      expirationDate: '',
      coveredCodes: [{ code: '', unitsCovered: 0, patientPays: 0 }],
      isPrimary: false,
      isActive: true
    };
    updateFormData({ 
      insuranceInfo: [...formData.insuranceInfo, newInsurance] 
    });
  };

  const removeInsurance = (index) => {
    const updatedInsurance = formData.insuranceInfo.filter((_, i) => i !== index);
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  const setPrimaryInsurance = (index) => {
    const updatedInsurance = formData.insuranceInfo.map((insurance, i) => ({
      ...insurance,
      isPrimary: i === index
    }));
    updateFormData({ insuranceInfo: updatedInsurance });
  };

  return (
    <div className="insurance-tab">
      <div className="section-header">🏥 Insurance Information</div>
      
      {formData.insuranceInfo.map((insurance, insuranceIndex) => (
        <div key={insuranceIndex} className="dynamic-list-item">
          {formData.insuranceInfo.length > 1 && (
            <button
              type="button"
              className="remove-item-btn"
              onClick={() => removeInsurance(insuranceIndex)}
            >
              ✕ Remove
            </button>
          )}
          
          <div className="insurance-header">
            <h4>
              Insurance {insuranceIndex + 1}
              {insurance.isPrimary && <span className="primary-badge">PRIMARY</span>}
            </h4>
            
            <div className="insurance-controls">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id={`primary-${insuranceIndex}`}
                  checked={insurance.isPrimary}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPrimaryInsurance(insuranceIndex);
                    }
                  }}
                />
                <label htmlFor={`primary-${insuranceIndex}`}>Primary Insurance</label>
              </div>
              
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id={`active-${insuranceIndex}`}
                  checked={insurance.isActive}
                  onChange={(e) => handleInsuranceChange(insuranceIndex, 'isActive', e.target.checked)}
                />
                <label htmlFor={`active-${insuranceIndex}`}>Active</label>
              </div>
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="required">Insurance Company</label>
              <input
                type="text"
                className="form-input"
                value={insurance.companyName}
                onChange={(e) => handleInsuranceChange(insuranceIndex, 'companyName', e.target.value)}
                placeholder="Blue Cross Blue Shield"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="required">Member ID</label>
              <input
                type="text"
                className="form-input"
                value={insurance.policyNumber}
                onChange={(e) => handleInsuranceChange(insuranceIndex, 'policyNumber', e.target.value)}
                placeholder="Member ID / Policy Number"
                required
              />
            </div>
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label>Group ID</label>
              <input
                type="text"
                className="form-input"
                value={insurance.groupId || ''}
                onChange={(e) => handleInsuranceChange(insuranceIndex, 'groupId', e.target.value)}
                placeholder="Group ID (optional)"
              />
            </div>
            
            <div className="form-group">
              <label className="required">Copay Amount ($)</label>
              <input
                type="number"
                className="form-input"
                value={insurance.copay}
                onChange={(e) => handleInsuranceChange(insuranceIndex, 'copay', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                className="form-input"
                value={insurance.expirationDate}
                onChange={(e) => handleInsuranceChange(insuranceIndex, 'expirationDate', e.target.value)}
              />
            </div>
          </div>

          <div className="covered-codes-section">
            <h5>Billing Code Coverage</h5>
            
            <div className="covered-codes-table">
              <div className="table-header">
                <div>Code</div>
                <div>Unit Coverage</div>
                <div>Patient Pays ($)</div>
                <div>Actions</div>
              </div>
              
              {insurance.coveredCodes.map((code, codeIndex) => (
                <div key={codeIndex} className="table-row">
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      value={code.code}
                      onChange={(e) => handleCoveredCodeChange(insuranceIndex, codeIndex, 'code', e.target.value)}
                      placeholder="98941"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input"
                      value={code.unitsCovered}
                      onChange={(e) => handleCoveredCodeChange(insuranceIndex, codeIndex, 'unitsCovered', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input"
                      value={code.patientPays}
                      onChange={(e) => handleCoveredCodeChange(insuranceIndex, codeIndex, 'patientPays', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    {insurance.coveredCodes.length > 1 && (
                      <button
                        type="button"
                        className="remove-code-btn"
                        onClick={() => removeCoveredCode(insuranceIndex, codeIndex)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              className="add-item-btn"
              onClick={() => addCoveredCode(insuranceIndex)}
            >
              + Add Billing Code
            </button>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        className="add-item-btn"
        onClick={addInsurance}
      >
        + Add Insurance Plan
      </button>

      <style jsx>{`
        .insurance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .insurance-header h4 {
          color: #f1f5f9;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .primary-badge {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        
        .insurance-controls {
          display: flex;
          gap: 1rem;
        }
        
        .covered-codes-section {
          margin-top: 1.5rem;
        }
        
        .covered-codes-section h5 {
          color: #f1f5f9;
          margin-bottom: 1rem;
        }
        
        .covered-codes-table {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(30, 41, 59, 0.8);
          color: #f1f5f9;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 1rem;
          padding: 0.75rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .remove-code-btn {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .remove-code-btn:hover {
          background: rgba(239, 68, 68, 1);
        }
      `}</style>
    </div>
  );
};

export default InsuranceTab;
