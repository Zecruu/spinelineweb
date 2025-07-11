import { useState } from 'react';

const DiagnosesSection = ({ diagnoses, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="diagnoses-section">
      <h2>🩺 Diagnoses Management</h2>
      <p>Diagnoses management interface coming soon...</p>
      
      <div className="current-diagnoses">
        <h3>Current Diagnoses</h3>
        {diagnoses?.primaryDiagnosis?.description && (
          <div className="diagnosis-item primary">
            <span className="diagnosis-code">{diagnoses.primaryDiagnosis.code}</span>
            <span className="diagnosis-description">{diagnoses.primaryDiagnosis.description}</span>
            <span className="diagnosis-type">Primary</span>
          </div>
        )}
        
        {diagnoses?.secondaryDiagnoses?.map((diagnosis, index) => (
          <div key={index} className="diagnosis-item secondary">
            <span className="diagnosis-code">{diagnosis.code}</span>
            <span className="diagnosis-description">{diagnosis.description}</span>
            <span className="diagnosis-type">Secondary</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagnosesSection;
