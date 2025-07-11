import { useState } from 'react';

const ProceduresSection = ({ procedures, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="procedures-section">
      <h2>🔧 Procedures Management</h2>
      <p>Procedures management interface coming soon...</p>
      
      <div className="current-procedures">
        <h3>Current Procedures</h3>
        {procedures?.map((procedure, index) => (
          <div key={index} className="procedure-item">
            <span className="procedure-code">{procedure.code}</span>
            <span className="procedure-description">{procedure.description}</span>
            <span className="procedure-units">Units: {procedure.units || 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProceduresSection;
