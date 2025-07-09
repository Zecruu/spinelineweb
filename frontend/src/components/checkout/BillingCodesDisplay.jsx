import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import './BillingCodesDisplay.css';

const BillingCodesDisplay = ({ 
  billingCodes, 
  setBillingCodes, 
  appointmentId, 
  patient, 
  token, 
  onCodesChange 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    price: '',
    units: 1,
    insuranceCovered: false
  });
  const [loading, setLoading] = useState(false);

  const commonBillingCodes = [
    { code: '98941', description: 'Chiropractic Manipulative Treatment - Spinal', price: 65.00 },
    { code: '98942', description: 'Chiropractic Manipulative Treatment - Extraspinal', price: 55.00 },
    { code: '97012', description: 'Mechanical Traction', price: 45.00 },
    { code: '97014', description: 'Electrical Stimulation', price: 35.00 },
    { code: '97110', description: 'Therapeutic Exercise', price: 50.00 },
    { code: '97112', description: 'Neuromuscular Reeducation', price: 55.00 },
    { code: '97140', description: 'Manual Therapy', price: 60.00 },
    { code: '99213', description: 'Office Visit - Established Patient', price: 85.00 },
    { code: '99214', description: 'Office Visit - Established Patient (Complex)', price: 125.00 }
  ];

  const handleAddBillingCode = async () => {
    try {
      setLoading(true);
      
      const codeData = {
        appointmentId,
        code: newCode.code,
        description: newCode.description,
        price: parseFloat(newCode.price),
        units: parseInt(newCode.units),
        insuranceCovered: newCode.insuranceCovered,
        addedBy: 'current-user' // Should be actual user ID
      };

      const response = await fetch(`${API_BASE_URL}/api/billing-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(codeData)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedCodes = [...billingCodes, data.data.billingCode];
        setBillingCodes(updatedCodes);
        onCodesChange(updatedCodes);
        
        setShowAddModal(false);
        setNewCode({
          code: '',
          description: '',
          price: '',
          units: 1,
          insuranceCovered: false
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to add billing code: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Add billing code error:', error);
      alert('Failed to add billing code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBillingCode = async (codeId) => {
    if (!confirm('Are you sure you want to remove this billing code?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/billing-codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedCodes = billingCodes.filter(code => code._id !== codeId);
        setBillingCodes(updatedCodes);
        onCodesChange(updatedCodes);
      } else {
        alert('Failed to remove billing code');
      }
    } catch (error) {
      console.error('Remove billing code error:', error);
      alert('Failed to remove billing code');
    }
  };

  const handleQuickAdd = (commonCode) => {
    setNewCode({
      code: commonCode.code,
      description: commonCode.description,
      price: commonCode.price.toString(),
      units: 1,
      insuranceCovered: false
    });
  };

  const calculateCodeTotal = (code) => {
    return (code.price * (code.units || 1)).toFixed(2);
  };

  const getInsuranceStatus = (code) => {
    if (!patient?.insurance) return 'Self-Pay';
    
    // Check if this code is covered by patient's insurance
    const insuranceInfo = patient.insurance;
    if (code.insuranceCovered) {
      return 'Covered';
    } else if (insuranceInfo.copay && insuranceInfo.copay > 0) {
      return `Copay: $${insuranceInfo.copay}`;
    } else {
      return 'Not Covered';
    }
  };

  return (
    <div className="checkout-section">
      <h3>💳 Billing Codes</h3>
      
      <div className="billing-codes-header">
        <p>Services rendered during this visit</p>
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Billing Code
        </button>
      </div>

      <div className="billing-codes-list">
        {billingCodes.length === 0 ? (
          <div className="no-codes">
            No billing codes added yet
          </div>
        ) : (
          billingCodes.map((code, index) => (
            <div key={index} className="billing-code-item">
              <div className="code-info">
                <div className="code-header">
                  <span className="code-number">{code.code}</span>
                  <span className="insurance-status">
                    {getInsuranceStatus(code)}
                  </span>
                </div>
                <div className="code-description">{code.description}</div>
                <div className="code-details">
                  <span>Units: {code.units || 1}</span>
                  <span>Price: ${code.price.toFixed(2)}</span>
                  <span className="code-total">Total: ${calculateCodeTotal(code)}</span>
                </div>
              </div>
              <button 
                className="btn-danger btn-remove"
                onClick={() => handleRemoveBillingCode(code._id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="billing-modal">
            <div className="modal-header">
              <h3>Add Billing Code</h3>
              <button 
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Quick Add Common Codes */}
              <div className="quick-add-section">
                <h4>Common Codes:</h4>
                <div className="common-codes-grid">
                  {commonBillingCodes.map((commonCode, index) => (
                    <button
                      key={index}
                      className="common-code-btn"
                      onClick={() => handleQuickAdd(commonCode)}
                    >
                      <div className="common-code-number">{commonCode.code}</div>
                      <div className="common-code-desc">{commonCode.description}</div>
                      <div className="common-code-price">${commonCode.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Entry */}
              <div className="manual-entry-section">
                <h4>Manual Entry:</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Code:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCode.code}
                      onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                      placeholder="e.g., 98941"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Units:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCode.units}
                      onChange={(e) => setNewCode({...newCode, units: e.target.value})}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCode.description}
                    onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                    placeholder="Service description"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newCode.price}
                      onChange={(e) => setNewCode({...newCode, price: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newCode.insuranceCovered}
                        onChange={(e) => setNewCode({...newCode, insuranceCovered: e.target.checked})}
                      />
                      Insurance Covered
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-success"
                onClick={handleAddBillingCode}
                disabled={!newCode.code || !newCode.description || !newCode.price || loading}
              >
                {loading ? 'Adding...' : 'Add Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingCodesDisplay;
