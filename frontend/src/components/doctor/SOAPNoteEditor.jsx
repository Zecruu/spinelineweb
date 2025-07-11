import { useState } from 'react';
import './SOAPNoteEditor.css';

const SOAPNoteEditor = ({ soapNote, onUpdate, patient }) => {
  const [activeSection, setActiveSection] = useState('subjective');

  const updateSection = (section, field, value) => {
    onUpdate(section, { [field]: value });
  };

  const updateNestedField = (section, parentField, field, value) => {
    const currentParent = soapNote[section][parentField] || {};
    onUpdate(section, {
      [parentField]: {
        ...currentParent,
        [field]: value
      }
    });
  };

  const renderSubjective = () => (
    <div className="soap-section">
      <h3>📝 Subjective</h3>
      
      <div className="form-group">
        <label>Chief Complaint</label>
        <textarea
          value={soapNote.subjective?.chiefComplaint || ''}
          onChange={(e) => updateNestedField('subjective', 'chiefComplaint', null, e.target.value)}
          placeholder="Patient's primary concern or reason for visit..."
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Pain Scale (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={soapNote.subjective?.painScale || ''}
            onChange={(e) => updateNestedField('subjective', 'painScale', null, parseInt(e.target.value) || null)}
            placeholder="0-10"
          />
        </div>
        
        <div className="form-group">
          <label>Pain Location</label>
          <input
            type="text"
            value={soapNote.subjective?.painLocation || ''}
            onChange={(e) => updateNestedField('subjective', 'painLocation', null, e.target.value)}
            placeholder="Location of pain..."
          />
        </div>
      </div>

      <div className="form-group">
        <label>History of Present Illness</label>
        <textarea
          value={soapNote.subjective?.historyOfPresentIllness || ''}
          onChange={(e) => updateNestedField('subjective', 'historyOfPresentIllness', null, e.target.value)}
          placeholder="Detailed history of the current condition..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Additional Notes</label>
        <textarea
          value={soapNote.subjective?.notes || ''}
          onChange={(e) => updateNestedField('subjective', 'notes', null, e.target.value)}
          placeholder="Additional subjective findings..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderObjective = () => (
    <div className="soap-section">
      <h3>🔍 Objective</h3>
      
      <div className="subsection">
        <h4>Vital Signs</h4>
        <div className="vitals-grid">
          <div className="form-group">
            <label>Blood Pressure</label>
            <input
              type="text"
              value={soapNote.objective?.vitalSigns?.bloodPressure || ''}
              onChange={(e) => updateNestedField('objective', 'vitalSigns', 'bloodPressure', e.target.value)}
              placeholder="120/80"
            />
          </div>
          
          <div className="form-group">
            <label>Heart Rate</label>
            <input
              type="number"
              value={soapNote.objective?.vitalSigns?.heartRate || ''}
              onChange={(e) => updateNestedField('objective', 'vitalSigns', 'heartRate', parseInt(e.target.value) || null)}
              placeholder="BPM"
            />
          </div>
          
          <div className="form-group">
            <label>Temperature</label>
            <input
              type="number"
              step="0.1"
              value={soapNote.objective?.vitalSigns?.temperature || ''}
              onChange={(e) => updateNestedField('objective', 'vitalSigns', 'temperature', parseFloat(e.target.value) || null)}
              placeholder="°F"
            />
          </div>
        </div>
      </div>

      <div className="subsection">
        <h4>Physical Examination</h4>
        
        <div className="form-group">
          <label>Inspection</label>
          <textarea
            value={soapNote.objective?.physicalExam?.inspection || ''}
            onChange={(e) => updateNestedField('objective', 'physicalExam', 'inspection', e.target.value)}
            placeholder="Visual examination findings..."
            rows="2"
          />
        </div>
        
        <div className="form-group">
          <label>Palpation</label>
          <textarea
            value={soapNote.objective?.physicalExam?.palpation || ''}
            onChange={(e) => updateNestedField('objective', 'physicalExam', 'palpation', e.target.value)}
            placeholder="Palpation findings..."
            rows="2"
          />
        </div>
        
        <div className="form-group">
          <label>Range of Motion</label>
          <textarea
            value={soapNote.objective?.physicalExam?.rangeOfMotion || ''}
            onChange={(e) => updateNestedField('objective', 'physicalExam', 'rangeOfMotion', e.target.value)}
            placeholder="ROM assessment..."
            rows="2"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Additional Objective Notes</label>
        <textarea
          value={soapNote.objective?.notes || ''}
          onChange={(e) => updateNestedField('objective', 'notes', null, e.target.value)}
          placeholder="Additional objective findings..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderAssessment = () => (
    <div className="soap-section">
      <h3>🩺 Assessment</h3>
      
      <div className="form-group">
        <label>Primary Diagnosis</label>
        <div className="diagnosis-input">
          <input
            type="text"
            value={soapNote.assessment?.primaryDiagnosis?.code || ''}
            onChange={(e) => updateNestedField('assessment', 'primaryDiagnosis', 'code', e.target.value)}
            placeholder="ICD Code"
            className="diagnosis-code"
          />
          <input
            type="text"
            value={soapNote.assessment?.primaryDiagnosis?.description || ''}
            onChange={(e) => updateNestedField('assessment', 'primaryDiagnosis', 'description', e.target.value)}
            placeholder="Diagnosis description"
            className="diagnosis-description"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Clinical Impression</label>
        <textarea
          value={soapNote.assessment?.clinicalImpression || ''}
          onChange={(e) => updateNestedField('assessment', 'clinicalImpression', null, e.target.value)}
          placeholder="Clinical assessment and impression..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Prognosis</label>
        <select
          value={soapNote.assessment?.prognosis || 'Good'}
          onChange={(e) => updateNestedField('assessment', 'prognosis', null, e.target.value)}
        >
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
          <option value="Guarded">Guarded</option>
        </select>
      </div>

      <div className="form-group">
        <label>Assessment Notes</label>
        <textarea
          value={soapNote.assessment?.notes || ''}
          onChange={(e) => updateNestedField('assessment', 'notes', null, e.target.value)}
          placeholder="Additional assessment notes..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="soap-section">
      <h3>📋 Plan</h3>
      
      <div className="form-group">
        <label>Treatment Plan</label>
        <textarea
          value={soapNote.plan?.treatmentPlan || ''}
          onChange={(e) => updateNestedField('plan', 'treatmentPlan', null, e.target.value)}
          placeholder="Detailed treatment plan..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Home Exercises</label>
        <textarea
          value={soapNote.plan?.homeExercises || ''}
          onChange={(e) => updateNestedField('plan', 'homeExercises', null, e.target.value)}
          placeholder="Recommended home exercises..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Follow-up Instructions</label>
        <textarea
          value={soapNote.plan?.followUpInstructions || ''}
          onChange={(e) => updateNestedField('plan', 'followUpInstructions', null, e.target.value)}
          placeholder="Follow-up care instructions..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Plan Notes</label>
        <textarea
          value={soapNote.plan?.notes || ''}
          onChange={(e) => updateNestedField('plan', 'notes', null, e.target.value)}
          placeholder="Additional plan notes..."
          rows="3"
        />
      </div>
    </div>
  );

  return (
    <div className="soap-editor">
      <div className="soap-nav">
        <button 
          className={`nav-btn ${activeSection === 'subjective' ? 'active' : ''}`}
          onClick={() => setActiveSection('subjective')}
        >
          S - Subjective
        </button>
        <button 
          className={`nav-btn ${activeSection === 'objective' ? 'active' : ''}`}
          onClick={() => setActiveSection('objective')}
        >
          O - Objective
        </button>
        <button 
          className={`nav-btn ${activeSection === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveSection('assessment')}
        >
          A - Assessment
        </button>
        <button 
          className={`nav-btn ${activeSection === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveSection('plan')}
        >
          P - Plan
        </button>
      </div>

      <div className="soap-content">
        {activeSection === 'subjective' && renderSubjective()}
        {activeSection === 'objective' && renderObjective()}
        {activeSection === 'assessment' && renderAssessment()}
        {activeSection === 'plan' && renderPlan()}
      </div>
    </div>
  );
};

export default SOAPNoteEditor;
