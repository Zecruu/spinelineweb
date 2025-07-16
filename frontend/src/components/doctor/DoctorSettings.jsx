import React, { useState, useEffect } from 'react';
import './DoctorSettings.css';

const DoctorSettings = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('macros');
  const [macros, setMacros] = useState({});
  const [editingMacro, setEditingMacro] = useState(null);
  const [newMacro, setNewMacro] = useState({
    name: '',
    text: '',
    category: '',
    section: 'subjective'
  });

  // Default preset macros (same as in MacroSelector)
  const defaultMacros = {
    subjective: [
      {
        id: 'chief_complaint',
        name: 'Chief Complaint',
        text: 'Patient presents with chief complaint of: ',
        category: 'General'
      },
      {
        id: 'pain_scale',
        name: 'Pain Scale',
        text: 'Patient rates pain as [X]/10 on numeric pain scale. Pain is described as [sharp/dull/aching/burning/throbbing].',
        category: 'Pain'
      }
    ],
    objective: [
      {
        id: 'vital_signs',
        name: 'Vital Signs',
        text: 'Vital Signs: BP [X/X], HR [X], RR [X], Temp [X]°F, O2 Sat [X]%',
        category: 'Vitals'
      }
    ],
    assessment: [
      {
        id: 'primary_diagnosis',
        name: 'Primary Diagnosis',
        text: 'Primary Diagnosis: [ICD-10 code] - [diagnosis description]',
        category: 'Diagnosis'
      }
    ],
    plan: [
      {
        id: 'chiropractic_treatment',
        name: 'Chiropractic Treatment',
        text: 'Chiropractic manipulation to [specific areas]. [Frequency] visits over [time period].',
        category: 'Treatment'
      }
    ]
  };

  useEffect(() => {
    // Load macros from localStorage
    const savedMacros = localStorage.getItem('soapMacros');
    if (savedMacros) {
      setMacros(JSON.parse(savedMacros));
    } else {
      setMacros(defaultMacros);
    }
  }, []);

  const saveMacros = (updatedMacros) => {
    setMacros(updatedMacros);
    localStorage.setItem('soapMacros', JSON.stringify(updatedMacros));
  };

  const handleAddMacro = () => {
    if (!newMacro.name || !newMacro.text) return;

    const id = Date.now().toString();
    const updatedMacros = {
      ...macros,
      [newMacro.section]: [
        ...(macros[newMacro.section] || []),
        {
          id,
          name: newMacro.name,
          text: newMacro.text,
          category: newMacro.category || 'Custom'
        }
      ]
    };

    saveMacros(updatedMacros);
    setNewMacro({
      name: '',
      text: '',
      category: '',
      section: 'subjective'
    });
  };

  const handleEditMacro = (section, macroId, updatedMacro) => {
    const updatedMacros = {
      ...macros,
      [section]: macros[section].map(macro =>
        macro.id === macroId ? { ...macro, ...updatedMacro } : macro
      )
    };
    saveMacros(updatedMacros);
    setEditingMacro(null);
  };

  const handleDeleteMacro = (section, macroId) => {
    const updatedMacros = {
      ...macros,
      [section]: macros[section].filter(macro => macro.id !== macroId)
    };
    saveMacros(updatedMacros);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all macros to defaults? This will delete all custom macros.')) {
      saveMacros(defaultMacros);
    }
  };

  const sections = [
    { id: 'macros', label: 'Chart Note Macros', icon: '📝' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Doctor Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            {sections.map(section => (
              <button
                key={section.id}
                className={`settings-nav-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="nav-icon">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          <div className="settings-main">
            {activeSection === 'macros' && (
              <div className="macros-section">
                <div className="section-header">
                  <h3>Chart Note Macros</h3>
                  <button className="reset-btn" onClick={resetToDefaults}>
                    Reset to Defaults
                  </button>
                </div>

                <div className="add-macro-form">
                  <h4>Add New Macro</h4>
                  <div className="form-row">
                    <select
                      value={newMacro.section}
                      onChange={(e) => setNewMacro({...newMacro, section: e.target.value})}
                    >
                      <option value="subjective">Subjective</option>
                      <option value="objective">Objective</option>
                      <option value="assessment">Assessment</option>
                      <option value="plan">Plan</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Macro name"
                      value={newMacro.name}
                      onChange={(e) => setNewMacro({...newMacro, name: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newMacro.category}
                      onChange={(e) => setNewMacro({...newMacro, category: e.target.value})}
                    />
                  </div>
                  <textarea
                    placeholder="Macro text content"
                    value={newMacro.text}
                    onChange={(e) => setNewMacro({...newMacro, text: e.target.value})}
                    rows={3}
                  />
                  <button className="add-btn" onClick={handleAddMacro}>
                    Add Macro
                  </button>
                </div>

                <div className="macros-list">
                  {Object.entries(macros).map(([section, sectionMacros]) => (
                    <div key={section} className="macro-section">
                      <h4>{section.charAt(0).toUpperCase() + section.slice(1)} Macros</h4>
                      {sectionMacros.map(macro => (
                        <div key={macro.id} className="macro-item">
                          {editingMacro === macro.id ? (
                            <div className="edit-macro-form">
                              <input
                                type="text"
                                value={macro.name}
                                onChange={(e) => handleEditMacro(section, macro.id, { name: e.target.value })}
                              />
                              <textarea
                                value={macro.text}
                                onChange={(e) => handleEditMacro(section, macro.id, { text: e.target.value })}
                                rows={3}
                              />
                              <div className="edit-actions">
                                <button onClick={() => setEditingMacro(null)}>Cancel</button>
                                <button onClick={() => setEditingMacro(null)}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className="macro-display">
                              <div className="macro-header">
                                <span className="macro-name">{macro.name}</span>
                                <span className="macro-category">{macro.category}</span>
                                <div className="macro-actions">
                                  <button onClick={() => setEditingMacro(macro.id)}>Edit</button>
                                  <button onClick={() => handleDeleteMacro(section, macro.id)}>Delete</button>
                                </div>
                              </div>
                              <div className="macro-text">{macro.text}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="preferences-section">
                <h3>Doctor Preferences</h3>
                <p>Additional preferences will be added here in future updates.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSettings;
