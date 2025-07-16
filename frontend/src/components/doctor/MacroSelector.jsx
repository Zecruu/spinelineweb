import React, { useState, useEffect } from 'react';
import './MacroSelector.css';

const MacroSelector = ({ onInsertMacro, soapSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [macros, setMacros] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Default preset macros
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
      },
      {
        id: 'onset',
        name: 'Pain Onset',
        text: 'Pain onset: [gradual/sudden] [X] [days/weeks/months] ago. Mechanism of injury: [describe or N/A].',
        category: 'Pain'
      },
      {
        id: 'location',
        name: 'Pain Location',
        text: 'Pain location: [specific area]. Radiation: [yes/no - describe pattern if yes].',
        category: 'Pain'
      },
      {
        id: 'aggravating',
        name: 'Aggravating/Relieving',
        text: 'Aggravating factors: [movement/position/activity]. Relieving factors: [rest/heat/ice/medication].',
        category: 'Pain'
      }
    ],
    objective: [
      {
        id: 'vital_signs',
        name: 'Vital Signs',
        text: 'Vital Signs: BP [X/X], HR [X], RR [X], Temp [X]°F, O2 Sat [X]%',
        category: 'Vitals'
      },
      {
        id: 'general_appearance',
        name: 'General Appearance',
        text: 'Patient appears [well/ill/distressed]. Alert and oriented x3. Ambulates [independently/with assistance].',
        category: 'General'
      },
      {
        id: 'rom_cervical',
        name: 'Cervical ROM',
        text: 'Cervical ROM: Flexion [X]°, Extension [X]°, Right Lateral Flexion [X]°, Left Lateral Flexion [X]°, Right Rotation [X]°, Left Rotation [X]°',
        category: 'ROM'
      },
      {
        id: 'rom_lumbar',
        name: 'Lumbar ROM',
        text: 'Lumbar ROM: Flexion [X]°, Extension [X]°, Right Lateral Flexion [X]°, Left Lateral Flexion [X]°',
        category: 'ROM'
      },
      {
        id: 'palpation',
        name: 'Palpation Findings',
        text: 'Palpation reveals [tenderness/spasm/trigger points] at [location]. [Mild/Moderate/Severe] tenderness noted.',
        category: 'Examination'
      },
      {
        id: 'orthopedic',
        name: 'Orthopedic Tests',
        text: 'Orthopedic tests performed: [test name] - [positive/negative]. [Additional findings if positive].',
        category: 'Tests'
      },
      {
        id: 'neurological',
        name: 'Neurological',
        text: 'Neurological: DTRs [normal/diminished/absent]. Sensation intact. Motor strength [5/5] bilateral.',
        category: 'Neurological'
      }
    ],
    assessment: [
      {
        id: 'primary_diagnosis',
        name: 'Primary Diagnosis',
        text: 'Primary Diagnosis: [ICD-10 code] - [diagnosis description]',
        category: 'Diagnosis'
      },
      {
        id: 'secondary_diagnosis',
        name: 'Secondary Diagnosis',
        text: 'Secondary Diagnosis: [ICD-10 code] - [diagnosis description]',
        category: 'Diagnosis'
      },
      {
        id: 'prognosis',
        name: 'Prognosis',
        text: 'Prognosis: [Good/Fair/Guarded] with [conservative care/treatment plan].',
        category: 'Prognosis'
      }
    ],
    plan: [
      {
        id: 'chiropractic_treatment',
        name: 'Chiropractic Treatment',
        text: 'Chiropractic manipulation to [specific areas]. [Frequency] visits over [time period].',
        category: 'Treatment'
      },
      {
        id: 'modalities',
        name: 'Therapeutic Modalities',
        text: 'Therapeutic modalities: [Ice/Heat/Electrical stimulation/Ultrasound] to [area] for [duration].',
        category: 'Treatment'
      },
      {
        id: 'exercises',
        name: 'Home Exercises',
        text: 'Home exercise program provided. Patient instructed on [specific exercises] [frequency/duration].',
        category: 'Treatment'
      },
      {
        id: 'patient_education',
        name: 'Patient Education',
        text: 'Patient education provided regarding [condition/posture/ergonomics/activity modification].',
        category: 'Education'
      },
      {
        id: 'follow_up',
        name: 'Follow-up',
        text: 'Follow-up in [X] [days/weeks] or sooner if symptoms worsen. Return to clinic for [next visit purpose].',
        category: 'Follow-up'
      },
      {
        id: 'referral',
        name: 'Referral',
        text: 'Referral to [specialist/imaging/other provider] for [reason]. Patient advised to schedule appointment.',
        category: 'Referral'
      }
    ]
  };

  useEffect(() => {
    // Load custom macros from localStorage
    const savedMacros = localStorage.getItem('soapMacros');
    if (savedMacros) {
      setMacros(JSON.parse(savedMacros));
    } else {
      setMacros(defaultMacros);
      localStorage.setItem('soapMacros', JSON.stringify(defaultMacros));
    }
  }, []);

  const filteredMacros = macros[soapSection]?.filter(macro =>
    macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    macro.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    macro.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleInsertMacro = (macro) => {
    onInsertMacro(macro.text);
    setIsOpen(false);
    setSearchTerm('');
  };

  const groupedMacros = filteredMacros.reduce((groups, macro) => {
    const category = macro.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(macro);
    return groups;
  }, {});

  return (
    <div className="macro-selector">
      <button
        className="macro-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Insert Macro"
      >
        <span className="macro-icon">📝</span>
        Macros
      </button>

      {isOpen && (
        <div className="macro-dropdown">
          <div className="macro-search">
            <input
              type="text"
              placeholder="Search macros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="macro-search-input"
            />
          </div>

          <div className="macro-list">
            {Object.keys(groupedMacros).length === 0 ? (
              <div className="no-macros">No macros found</div>
            ) : (
              Object.entries(groupedMacros).map(([category, categoryMacros]) => (
                <div key={category} className="macro-category">
                  <div className="macro-category-header">{category}</div>
                  {categoryMacros.map((macro) => (
                    <div
                      key={macro.id}
                      className="macro-item"
                      onClick={() => handleInsertMacro(macro)}
                    >
                      <div className="macro-name">{macro.name}</div>
                      <div className="macro-preview">{macro.text.substring(0, 80)}...</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="macro-footer">
            <button
              className="macro-settings-btn"
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings - we'll implement this
                window.location.href = '/doctor/settings';
              }}
            >
              ⚙️ Manage Macros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroSelector;
