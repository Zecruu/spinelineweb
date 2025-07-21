import { useState } from 'react';
import './SpinalListings.css';

const SpinalListings = ({ listings, onUpdate }) => {
  const [activeSpineType, setActiveSpineType] = useState('cervical');
  const [selectedSegment, setSelectedSegment] = useState('C1');

  const spineSegments = {
    cervical: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    thoracic: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    lumbar: ['L1', 'L2', 'L3', 'L4', 'L5'],
    sacral: ['S1', 'S2', 'S3', 'S4', 'S5']
  };

  const spineTypes = [
    { id: 'cervical', label: 'Cervical Spine', color: '#3b82f6' },
    { id: 'thoracic', label: 'Thoracic Spine', color: '#10b981' },
    { id: 'lumbar', label: 'Lumbar Spine', color: '#f59e0b' },
    { id: 'complete', label: 'Complete Spine', color: '#8b5cf6' }
  ];

  const getCurrentSegmentData = () => {
    return listings.find(listing => listing.level === selectedSegment) || {
      level: selectedSegment,
      findings: '',
      treatment: '',
      notes: ''
    };
  };

  const updateSegmentData = (field, value) => {
    const existingIndex = listings.findIndex(listing => listing.level === selectedSegment);
    const updatedListings = [...listings];

    if (existingIndex >= 0) {
      updatedListings[existingIndex] = {
        ...updatedListings[existingIndex],
        [field]: value
      };
    } else {
      updatedListings.push({
        level: selectedSegment,
        findings: field === 'findings' ? value : '',
        treatment: field === 'treatment' ? value : '',
        notes: field === 'notes' ? value : ''
      });
    }

    onUpdate(updatedListings);
  };

  const handleSegmentSelect = (segment) => {
    setSelectedSegment(segment);

    // Auto-switch spine type based on selected segment
    if (segment.startsWith('C')) {
      setActiveSpineType('cervical');
    } else if (segment.startsWith('T')) {
      setActiveSpineType('thoracic');
    } else if (segment.startsWith('L')) {
      setActiveSpineType('lumbar');
    } else if (segment.startsWith('S')) {
      setActiveSpineType('sacral');
    }
  };

  const getSegmentStatus = (segment) => {
    const hasData = listings.some(listing =>
      listing.level === segment &&
      (listing.findings || listing.treatment || listing.notes)
    );
    return hasData ? 'documented' : 'empty';
  };

  const segmentData = getCurrentSegmentData();

  return (
    <div className="spine-listings-container">
      <div className="spine-diagram-section">
        <h3 className="section-title">Interactive Spine Diagram</h3>

        <div className="spine-diagram">
          {Object.entries(spineSegments).map(([spineType, segments]) => (
            <div key={spineType} className={`spine-section ${spineType}`}>
              <div className="spine-label">{spineType.charAt(0).toUpperCase() + spineType.slice(1)}</div>
              <div className="spine-segments">
                {segments.map(segment => (
                  <button
                    key={segment}
                    className={`spine-segment-btn ${getSegmentStatus(segment)} ${selectedSegment === segment ? 'selected' : ''}`}
                    onClick={() => handleSegmentSelect(segment)}
                  >
                    {segment}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="spine-documentation-section">
        <div className="documentation-header">
          <h3>Spine Segment Documentation</h3>
          <div className="spine-type-tabs">
            {spineTypes.map(type => (
              <button
                key={type.id}
                className={`spine-type-tab ${activeSpineType === type.id ? 'active' : ''}`}
                onClick={() => setActiveSpineType(type.id)}
                style={{ '--tab-color': type.color }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="segment-info">
          <div className="segment-badge">
            <span className="segment-label">{selectedSegment}</span>
            <span className="segment-title">Segment Documentation</span>
          </div>
        </div>

        <div className="documentation-fields">
          <div className="field-group">
            <label>FINDINGS:</label>
            <textarea
              value={segmentData.findings}
              onChange={(e) => updateSegmentData('findings', e.target.value)}
              placeholder="Enter findings..."
              rows="3"
            />
          </div>

          <div className="field-group">
            <label>TREATMENT:</label>
            <textarea
              value={segmentData.treatment}
              onChange={(e) => updateSegmentData('treatment', e.target.value)}
              placeholder="Enter treatment..."
              rows="3"
            />
          </div>

          <div className="field-group">
            <label>NOTES:</label>
            <textarea
              value={segmentData.notes}
              onChange={(e) => updateSegmentData('notes', e.target.value)}
              placeholder="Enter notes..."
              rows="3"
            />
          </div>
        </div>

        <div className="quick-navigation">
          <div className="nav-title">
            Quick Navigation - {activeSpineType === 'complete' ? 'All Segments' :
              spineTypes.find(t => t.id === activeSpineType)?.label || 'Cervical Spine'}
          </div>
          <div className="nav-segments">
            {(activeSpineType === 'complete' ?
              [...spineSegments.cervical, ...spineSegments.thoracic, ...spineSegments.lumbar] :
              spineSegments[activeSpineType] || spineSegments.cervical
            ).map(segment => (
              <button
                key={segment}
                className={`nav-segment-btn ${getSegmentStatus(segment)} ${selectedSegment === segment ? 'selected' : ''}`}
                onClick={() => handleSegmentSelect(segment)}
              >
                {segment}
              </button>
            ))}
          </div>
          <div className="nav-status">Segments with a green ring have documentation entered</div>
        </div>
      </div>
    </div>
  );
};

export default SpinalListings;
