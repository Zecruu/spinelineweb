import { useState } from 'react';

const SpinalListings = ({ listings, onUpdate }) => {
  const spinalLevels = [
    'Occiput', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
    'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
    'L1', 'L2', 'L3', 'L4', 'L5', 'S1'
  ];

  const addListing = (level) => {
    const newListing = {
      level,
      findings: '',
      adjustments: '',
      treatment: ''
    };
    onUpdate([...listings, newListing]);
  };

  const updateListing = (index, field, value) => {
    const updatedListings = [...listings];
    updatedListings[index] = {
      ...updatedListings[index],
      [field]: value
    };
    onUpdate(updatedListings);
  };

  const removeListing = (index) => {
    const updatedListings = listings.filter((_, i) => i !== index);
    onUpdate(updatedListings);
  };

  return (
    <div className="spinal-listings">
      <h2>🦴 Spinal Listings</h2>
      
      <div className="spinal-levels-grid">
        {spinalLevels.map(level => {
          const hasListing = listings.some(listing => listing.level === level);
          return (
            <button
              key={level}
              className={`level-btn ${hasListing ? 'has-listing' : ''}`}
              onClick={() => !hasListing && addListing(level)}
              disabled={hasListing}
            >
              {level}
            </button>
          );
        })}
      </div>

      <div className="current-listings">
        <h3>Current Listings</h3>
        {listings.map((listing, index) => (
          <div key={index} className="listing-item">
            <div className="listing-header">
              <h4>{listing.level}</h4>
              <button 
                className="remove-btn"
                onClick={() => removeListing(index)}
              >
                ✕
              </button>
            </div>
            
            <div className="listing-fields">
              <div className="field-group">
                <label>Findings</label>
                <textarea
                  value={listing.findings}
                  onChange={(e) => updateListing(index, 'findings', e.target.value)}
                  placeholder="Clinical findings..."
                  rows="2"
                />
              </div>
              
              <div className="field-group">
                <label>Adjustments</label>
                <textarea
                  value={listing.adjustments}
                  onChange={(e) => updateListing(index, 'adjustments', e.target.value)}
                  placeholder="Adjustments performed..."
                  rows="2"
                />
              </div>
              
              <div className="field-group">
                <label>Treatment</label>
                <textarea
                  value={listing.treatment}
                  onChange={(e) => updateListing(index, 'treatment', e.target.value)}
                  placeholder="Treatment provided..."
                  rows="2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpinalListings;
