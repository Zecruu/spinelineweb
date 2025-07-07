import { useState } from 'react';

const PersonalInfoTab = ({ formData, updateFormData }) => {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updateFormData({
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      updateFormData({ [field]: value });
    }
  };

  const handleAddressChange = async (value) => {
    handleInputChange('address.street', value);
    
    // TODO: Integrate with Google Maps API for address suggestions
    // For now, we'll just update the field
    if (value.length > 3) {
      // Mock address suggestions - replace with actual Google Maps API
      const mockSuggestions = [
        '123 Main St, Anytown, ST 12345',
        '456 Oak Ave, Somewhere, ST 67890',
        '789 Pine Rd, Elsewhere, ST 54321'
      ].filter(addr => addr.toLowerCase().includes(value.toLowerCase()));
      
      setAddressSuggestions(mockSuggestions);
      setShowAddressSuggestions(mockSuggestions.length > 0);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  const selectAddressSuggestion = (suggestion) => {
    // Parse the suggestion and populate address fields
    const parts = suggestion.split(', ');
    if (parts.length >= 3) {
      const [street, city, stateZip] = parts;
      const [state, zipCode] = stateZip.split(' ');
      
      updateFormData({
        address: {
          ...formData.address,
          street,
          city,
          state,
          zipCode
        }
      });
    }
    setShowAddressSuggestions(false);
  };

  return (
    <div className="personal-info-tab">
      <div className="section-header">👤 Personal Information</div>
      
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="required">First Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="required">Last Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div className="form-grid form-grid-3">
        <div className="form-group">
          <label className="required">Date of Birth</label>
          <input
            type="date"
            className="form-input"
            value={formData.dob}
            onChange={(e) => handleInputChange('dob', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="required">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="patient@example.com"
          />
        </div>
      </div>

      <div className="form-grid form-grid-3">
        <div className="form-group">
          <label className="required">Gender</label>
          <select
            className="form-select"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Preferred Language</label>
          <select
            className="form-select"
            value={formData.preferredLanguage}
            onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="required">Patient Type</label>
          <select
            className="form-select"
            value={formData.patientType}
            onChange={(e) => handleInputChange('patientType', e.target.value)}
            required
          >
            <option value="Chiropractic">Chiropractic</option>
            <option value="Decompression">Decompression</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </div>

      <div className="section-header">🏠 Address Information</div>
      
      <div className="form-group">
        <label>Street Address</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            value={formData.address.street}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="123 Main Street"
          />
          
          {showAddressSuggestions && (
            <div className="address-suggestions">
              {addressSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="address-suggestion"
                  onClick={() => selectAddressSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-grid form-grid-4">
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            className="form-input"
            value={formData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            placeholder="City"
          />
        </div>
        
        <div className="form-group">
          <label>State</label>
          <input
            type="text"
            className="form-input"
            value={formData.address.state}
            onChange={(e) => handleInputChange('address.state', e.target.value)}
            placeholder="ST"
            maxLength="2"
          />
        </div>
        
        <div className="form-group">
          <label>ZIP Code</label>
          <input
            type="text"
            className="form-input"
            value={formData.address.zipCode}
            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
            placeholder="12345"
          />
        </div>
        
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            className="form-input"
            value={formData.address.country}
            onChange={(e) => handleInputChange('address.country', e.target.value)}
            placeholder="USA"
          />
        </div>
      </div>

      <div className="section-header">🚨 Emergency Contact</div>
      
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label>Contact Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.emergencyContact.name}
            onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
            placeholder="Emergency contact name"
          />
        </div>
        
        <div className="form-group">
          <label>Relationship</label>
          <input
            type="text"
            className="form-input"
            value={formData.emergencyContact.relationship}
            onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
            placeholder="Spouse, Parent, etc."
          />
        </div>
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label>Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            value={formData.emergencyContact.phone}
            onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div className="form-group">
          <label>Contact Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.emergencyContact.email}
            onChange={(e) => handleInputChange('emergencyContact.email', e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
      </div>

      <style jsx>{`
        .address-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 6px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .address-suggestion {
          padding: 0.75rem;
          cursor: pointer;
          color: #f1f5f9;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .address-suggestion:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        
        .address-suggestion:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default PersonalInfoTab;
