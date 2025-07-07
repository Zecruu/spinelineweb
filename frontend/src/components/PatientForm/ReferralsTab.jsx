import { useState, useEffect } from 'react';

const ReferralsTab = ({ formData, updateFormData }) => {
  const [savedReferrers, setSavedReferrers] = useState([
    'Dr. Smith - Family Medicine',
    'Dr. Johnson - Orthopedics',
    'Dr. Williams - Physical Therapy',
    'Dr. Brown - Neurology'
  ]);

  const referralSources = [
    'MD',
    'Patient',
    'Facebook',
    'Google Ads',
    'Website',
    'Word of Mouth',
    'Insurance',
    'Other'
  ];

  const handleReferralChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updateFormData({
        referral: {
          ...formData.referral,
          [parent]: {
            ...formData.referral[parent],
            [child]: value
          }
        }
      });
    } else {
      updateFormData({
        referral: {
          ...formData.referral,
          [field]: value
        }
      });
    }
  };

  const addNewReferrer = () => {
    const newReferrer = formData.referral.referredBy;
    if (newReferrer && !savedReferrers.includes(newReferrer)) {
      setSavedReferrers(prev => [...prev, newReferrer]);
    }
  };

  return (
    <div className="referrals-tab">
      <div className="section-header">🔗 Referral Information</div>
      
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label>Referred By</label>
          <div className="referrer-input-group">
            <input
              type="text"
              className="form-input"
              value={formData.referral.referredBy}
              onChange={(e) => handleReferralChange('referredBy', e.target.value)}
              placeholder="Enter referrer name or select from dropdown"
              list="saved-referrers"
            />
            
            <datalist id="saved-referrers">
              {savedReferrers.map((referrer, index) => (
                <option key={index} value={referrer} />
              ))}
            </datalist>
            
            <button
              type="button"
              className="add-referrer-btn"
              onClick={addNewReferrer}
              title="Save this referrer for future use"
            >
              💾
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label className="required">Referral Source</label>
          <select
            className="form-select"
            value={formData.referral.source}
            onChange={(e) => handleReferralChange('source', e.target.value)}
            required
          >
            {referralSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="referral-bonus"
            checked={formData.referral.bonusPaid}
            onChange={(e) => handleReferralChange('bonusPaid', e.target.checked)}
          />
          <label htmlFor="referral-bonus">Referral Bonus Paid</label>
        </div>
        <small className="field-hint">
          Check this box if an incentive payout has been logged for this referral
        </small>
      </div>

      {formData.referral.source === 'MD' && (
        <>
          <div className="section-header">👨‍⚕️ Referring Doctor Details</div>
          
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label>Doctor Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.referral.referringDoctor.name}
                onChange={(e) => handleReferralChange('referringDoctor.name', e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>
            
            <div className="form-group">
              <label>NPI Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.referral.referringDoctor.npi}
                onChange={(e) => handleReferralChange('referringDoctor.npi', e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.referral.referringDoctor.phone}
                onChange={(e) => handleReferralChange('referringDoctor.phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.referral.referringDoctor.email}
                onChange={(e) => handleReferralChange('referringDoctor.email', e.target.value)}
                placeholder="doctor@clinic.com"
              />
            </div>
          </div>
        </>
      )}

      <div className="referral-summary">
        <h4>Referral Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Source:</label>
            <span>{formData.referral.source || 'Not specified'}</span>
          </div>
          
          <div className="summary-item">
            <label>Referred By:</label>
            <span>{formData.referral.referredBy || 'Not specified'}</span>
          </div>
          
          <div className="summary-item">
            <label>Bonus Status:</label>
            <span className={`bonus-status ${formData.referral.bonusPaid ? 'paid' : 'unpaid'}`}>
              {formData.referral.bonusPaid ? '✅ Paid' : '⏳ Pending'}
            </span>
          </div>
          
          {formData.referral.source === 'MD' && formData.referral.referringDoctor.name && (
            <div className="summary-item">
              <label>Doctor:</label>
              <span>{formData.referral.referringDoctor.name}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .referrer-input-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .referrer-input-group .form-input {
          flex: 1;
        }
        
        .add-referrer-btn {
          background: rgba(34, 197, 94, 0.8);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .add-referrer-btn:hover {
          background: rgba(34, 197, 94, 1);
          transform: translateY(-1px);
        }
        
        .field-hint {
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.8rem;
          margin-top: 0.25rem;
          display: block;
        }
        
        .referral-summary {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(51, 65, 85, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .referral-summary h4 {
          color: #f1f5f9;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .summary-item label {
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item span {
          color: #f1f5f9;
          font-weight: 500;
        }
        
        .bonus-status.paid {
          color: #22c55e;
        }
        
        .bonus-status.unpaid {
          color: #f59e0b;
        }
        
        @media (max-width: 768px) {
          .referrer-input-group {
            flex-direction: column;
          }
          
          .add-referrer-btn {
            width: 100%;
          }
          
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReferralsTab;
