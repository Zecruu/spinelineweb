import React, { useState } from 'react';
import './SmartTemplate.css';

const SmartTemplate = ({ onInsertTemplate, soapSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [templateData, setTemplateData] = useState({});

  // Smart templates with selectable fields
  const smartTemplates = {
    subjective: [
      {
        id: 'pain_assessment',
        name: 'Pain Assessment',
        template: `Chief Complaint: Patient reports [pain_location] pain rated [pain_scale]/10 on numeric pain scale.

Onset: Pain began [onset_time] and is described as [pain_quality].

Aggravating Factors: Pain is worsened by [aggravating_factors].

Relieving Factors: Pain is improved by [relieving_factors].

Associated Symptoms: [associated_symptoms].`,
        fields: {
          pain_location: {
            type: 'select',
            label: 'Pain Location',
            options: [
              'cervical', 'thoracic', 'lumbar', 'sacral', 'left cervical', 'right cervical',
              'left shoulder', 'right shoulder', 'bilateral shoulders', 'mid-back',
              'lower back', 'left hip', 'right hip', 'bilateral hips'
            ]
          },
          pain_scale: {
            type: 'select',
            label: 'Pain Scale (0-10)',
            options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          },
          onset_time: {
            type: 'select',
            label: 'Onset Time',
            options: [
              'this morning', 'yesterday', '2 days ago', '3 days ago', 'this week',
              '2 weeks ago', '1 month ago', '2 months ago', '3 months ago', 'gradually over time'
            ]
          },
          pain_quality: {
            type: 'select',
            label: 'Pain Quality',
            options: [
              'sharp', 'dull', 'aching', 'burning', 'throbbing', 'stabbing',
              'cramping', 'shooting', 'radiating', 'constant', 'intermittent'
            ]
          },
          aggravating_factors: {
            type: 'multi-select',
            label: 'What aggravates the symptoms?',
            options: [
              'almost any movement', 'bending', 'lifting', 'sitting', 'standing',
              'walking', 'coughing', 'sneezing', 'morning stiffness', 'prolonged activity',
              'weather changes', 'stress', 'none', 'unknown action'
            ]
          },
          relieving_factors: {
            type: 'multi-select',
            label: 'What relieves the symptoms?',
            options: [
              'rest', 'heat', 'ice', 'medication', 'stretching', 'massage',
              'position change', 'movement', 'none', 'unknown'
            ]
          },
          associated_symptoms: {
            type: 'multi-select',
            label: 'Associated Symptoms',
            options: [
              'none', 'headache', 'dizziness', 'numbness', 'tingling',
              'weakness', 'muscle spasms', 'stiffness', 'radiating pain',
              'sleep disturbance', 'fatigue'
            ]
          }
        }
      }
    ],
    objective: [
      {
        id: 'cervical_exam',
        name: 'Cervical Spine Examination',
        template: `Cervical Range of Motion: [cervical_rom]
Flexion (normal 60°): [flexion_rom] [flexion_pain]
Extension (normal 50°): [extension_rom] [extension_pain]  
Left Rotation (normal 80°): [left_rotation_rom] [left_rotation_pain]
Right Rotation (normal 80°): [right_rotation_rom] [right_rotation_pain]
Left Lateral Flexion (normal 45°): [left_lateral_rom] [left_lateral_pain]
Right Lateral Flexion (normal 45°): [right_lateral_rom] [right_lateral_pain]

Palpation: [palpation_findings]

Orthopedic Tests: [orthopedic_tests]

Neurological: [neurological_findings]`,
        fields: {
          cervical_rom: {
            type: 'select',
            label: 'Overall Cervical ROM',
            options: [
              'Within normal limits without pain noted',
              'Mildly reduced with pain noted',
              'Moderately reduced with pain noted', 
              'Severely reduced with pain noted',
              'Mildly reduced without pain noted',
              'Moderately reduced without pain noted'
            ]
          },
          flexion_rom: {
            type: 'select',
            label: 'Flexion ROM',
            options: ['60°', '50°', '45°', '40°', '35°', '30°', '25°', '20°', '15°', '10°', '5°']
          },
          flexion_pain: {
            type: 'select',
            label: 'Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          extension_rom: {
            type: 'select',
            label: 'Extension ROM',
            options: ['50°', '45°', '40°', '35°', '30°', '25°', '20°', '15°', '10°', '5°']
          },
          extension_pain: {
            type: 'select',
            label: 'Extension Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          left_rotation_rom: {
            type: 'select',
            label: 'Left Rotation ROM',
            options: ['80°', '75°', '70°', '65°', '60°', '55°', '50°', '45°', '40°', '35°', '30°']
          },
          left_rotation_pain: {
            type: 'select',
            label: 'Left Rotation Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          right_rotation_rom: {
            type: 'select',
            label: 'Right Rotation ROM',
            options: ['80°', '75°', '70°', '65°', '60°', '55°', '50°', '45°', '40°', '35°', '30°']
          },
          right_rotation_pain: {
            type: 'select',
            label: 'Right Rotation Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          left_lateral_rom: {
            type: 'select',
            label: 'Left Lateral Flexion ROM',
            options: ['45°', '40°', '35°', '30°', '25°', '20°', '15°', '10°', '5°']
          },
          left_lateral_pain: {
            type: 'select',
            label: 'Left Lateral Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          right_lateral_rom: {
            type: 'select',
            label: 'Right Lateral Flexion ROM',
            options: ['45°', '40°', '35°', '30°', '25°', '20°', '15°', '10°', '5°']
          },
          right_lateral_pain: {
            type: 'select',
            label: 'Right Lateral Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          palpation_findings: {
            type: 'multi-select',
            label: 'Palpation Findings',
            options: [
              'No tenderness noted', 'Mild tenderness', 'Moderate tenderness', 'Severe tenderness',
              'Muscle spasm present', 'Trigger points noted', 'Swelling noted', 'Heat noted',
              'Restricted tissue texture', 'Normal tissue texture'
            ]
          },
          orthopedic_tests: {
            type: 'multi-select',
            label: 'Orthopedic Tests',
            options: [
              'Spurling\'s test - negative', 'Spurling\'s test - positive',
              'Distraction test - negative', 'Distraction test - positive',
              'Shoulder depression test - negative', 'Shoulder depression test - positive',
              'Adson\'s test - negative', 'Adson\'s test - positive'
            ]
          },
          neurological_findings: {
            type: 'multi-select',
            label: 'Neurological Findings',
            options: [
              'DTRs normal bilaterally', 'DTRs diminished', 'DTRs absent',
              'Sensation intact', 'Sensation diminished', 'Motor strength 5/5',
              'Motor strength 4/5', 'Motor strength 3/5', 'No neurological deficits'
            ]
          }
        }
      },
      {
        id: 'lumbar_exam',
        name: 'Lumbar Spine Examination',
        template: `Lumbar Range of Motion: [lumbar_rom]
Flexion (normal 60°): [flexion_rom] [flexion_pain]
Extension (normal 25°): [extension_rom] [extension_pain]
Left Lateral Flexion (normal 25°): [left_lateral_rom] [left_lateral_pain]
Right Lateral Flexion (normal 25°): [right_lateral_rom] [right_lateral_pain]

Palpation: [palpation_findings]

Orthopedic Tests: [orthopedic_tests]

Neurological: [neurological_findings]`,
        fields: {
          lumbar_rom: {
            type: 'select',
            label: 'How severe is decrease in ROM noted?',
            options: [
              'Within normal limits without pain noted',
              'Mildly reduced with pain noted',
              'Moderately reduced with pain noted',
              'Severely reduced with pain noted',
              'Mildly reduced without pain noted',
              'Moderately reduced without pain noted'
            ]
          },
          flexion_rom: {
            type: 'select',
            label: 'Flexion ROM',
            options: ['60°', '55°', '50°', '45°', '40°', '35°', '30°', '25°', '20°', '15°', '10°']
          },
          flexion_pain: {
            type: 'select',
            label: 'Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          extension_rom: {
            type: 'select',
            label: 'Extension ROM',
            options: ['25°', '20°', '15°', '10°', '5°']
          },
          extension_pain: {
            type: 'select',
            label: 'Extension Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          left_lateral_rom: {
            type: 'select',
            label: 'Left Lateral Flexion ROM',
            options: ['25°', '20°', '15°', '10°', '5°']
          },
          left_lateral_pain: {
            type: 'select',
            label: 'Left Lateral Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          right_lateral_rom: {
            type: 'select',
            label: 'Right Lateral Flexion ROM',
            options: ['25°', '20°', '15°', '10°', '5°']
          },
          right_lateral_pain: {
            type: 'select',
            label: 'Right Lateral Flexion Pain',
            options: ['without pain noted', 'with pain noted', 'with mild pain', 'with moderate pain', 'with severe pain']
          },
          palpation_findings: {
            type: 'multi-select',
            label: 'Palpation Findings',
            options: [
              'No tenderness noted', 'Mild tenderness', 'Moderate tenderness', 'Severe tenderness',
              'Muscle spasm present', 'Trigger points noted', 'Swelling noted', 'Heat noted',
              'Restricted tissue texture', 'Normal tissue texture'
            ]
          },
          orthopedic_tests: {
            type: 'multi-select',
            label: 'Orthopedic Tests',
            options: [
              'Straight leg raise - negative', 'Straight leg raise - positive',
              'Braggard\'s test - negative', 'Braggard\'s test - positive',
              'Kemp\'s test - negative', 'Kemp\'s test - positive',
              'Patrick\'s test - negative', 'Patrick\'s test - positive'
            ]
          },
          neurological_findings: {
            type: 'multi-select',
            label: 'Neurological Findings',
            options: [
              'DTRs normal bilaterally', 'DTRs diminished', 'DTRs absent',
              'Sensation intact', 'Sensation diminished', 'Motor strength 5/5',
              'Motor strength 4/5', 'Motor strength 3/5', 'No neurological deficits'
            ]
          }
        }
      }
    ]
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setTemplateData({});
    setIsOpen(false);
  };

  const handleFieldClick = (fieldKey, field) => {
    setCurrentField({ key: fieldKey, ...field });
    setShowSelectionModal(true);
  };

  const handleFieldSelection = (value) => {
    if (currentField.type === 'multi-select') {
      const currentValues = templateData[currentField.key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setTemplateData(prev => ({
        ...prev,
        [currentField.key]: newValues
      }));
    } else {
      setTemplateData(prev => ({
        ...prev,
        [currentField.key]: value
      }));
      setShowSelectionModal(false);
    }
  };

  const generateFinalText = () => {
    if (!selectedTemplate) return '';
    
    let text = selectedTemplate.template;
    
    Object.entries(selectedTemplate.fields).forEach(([key, field]) => {
      const value = templateData[key];
      let replacement = '';
      
      if (value) {
        if (Array.isArray(value)) {
          replacement = value.join(', ');
        } else {
          replacement = value;
        }
      } else {
        replacement = `[${field.label}]`;
      }
      
      text = text.replace(new RegExp(`\\[${key}\\]`, 'g'), replacement);
    });
    
    return text;
  };

  const insertTemplate = () => {
    const finalText = generateFinalText();
    onInsertTemplate(finalText);
    setSelectedTemplate(null);
    setTemplateData({});
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;
    
    const text = selectedTemplate.template;
    const parts = text.split(/(\[[^\]]+\])/g);
    
    return (
      <div className="template-preview">
        {parts.map((part, index) => {
          const fieldMatch = part.match(/\[([^\]]+)\]/);
          if (fieldMatch) {
            const fieldKey = fieldMatch[1];
            const field = selectedTemplate.fields[fieldKey];
            const hasValue = templateData[fieldKey];
            
            return (
              <span
                key={index}
                className={`template-field ${hasValue ? 'filled' : 'empty'}`}
                onClick={() => handleFieldClick(fieldKey, field)}
              >
                {hasValue 
                  ? (Array.isArray(templateData[fieldKey]) 
                      ? templateData[fieldKey].join(', ') 
                      : templateData[fieldKey])
                  : `[${field.label}]`
                }
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const availableTemplates = smartTemplates[soapSection] || [];

  return (
    <div className="smart-template">
      <button
        className="template-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Smart Templates"
      >
        <span className="template-icon">🎯</span>
        Smart Templates
      </button>

      {isOpen && (
        <div className="template-dropdown">
          <div className="template-list">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                className="template-item"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="template-name">{template.name}</div>
                <div className="template-description">Interactive clinical template</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="template-builder-modal">
          <div className="template-builder">
            <div className="builder-header">
              <h3>{selectedTemplate.name}</h3>
              <button onClick={() => setSelectedTemplate(null)}>×</button>
            </div>
            
            <div className="builder-content">
              {renderTemplatePreview()}
            </div>
            
            <div className="builder-actions">
              <button onClick={() => setSelectedTemplate(null)}>Cancel</button>
              <button onClick={insertTemplate} className="insert-btn">Insert Template</button>
            </div>
          </div>
        </div>
      )}

      {showSelectionModal && currentField && (
        <div className="selection-modal">
          <div className="selection-content">
            <div className="selection-header">
              <h4>{currentField.label}</h4>
              <button onClick={() => setShowSelectionModal(false)}>×</button>
            </div>
            
            <div className="selection-options">
              {currentField.options.map((option, index) => (
                <label key={index} className="selection-option">
                  <input
                    type={currentField.type === 'multi-select' ? 'checkbox' : 'radio'}
                    name={currentField.key}
                    checked={
                      currentField.type === 'multi-select'
                        ? (templateData[currentField.key] || []).includes(option)
                        : templateData[currentField.key] === option
                    }
                    onChange={() => handleFieldSelection(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            
            <div className="selection-actions">
              <button onClick={() => setShowSelectionModal(false)}>
                {currentField.type === 'multi-select' ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTemplate;
