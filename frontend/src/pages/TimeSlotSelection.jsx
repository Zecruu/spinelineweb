import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './TimeSlotSelection.css';
import PatientSearch from '../components/PatientSearch';

const TimeSlotSelection = ({ token, user, selectedDates: propSelectedDates, onBack }) => {
  // Color mapping for appointment colors
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    orange: '#f97316',
    white: '#f8fafc'
  };
  const [selectedDates, setSelectedDates] = useState(propSelectedDates || []);
  const [timeSlots, setTimeSlots] = useState([]);
  const [clinicSettings, setClinicSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('clinicSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved clinic settings:', error);
      }
    }
    return {
      startTime: '09:00',
      endTime: '21:00',
      interval: 30,
      breakTimes: ['12:00-13:00'] // Default lunch break
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [appointments, setAppointments] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentType, setAppointmentType] = useState('Regular');
  const [appointmentColor, setAppointmentColor] = useState('blue');

  // Initialize from props
  useEffect(() => {
    if (propSelectedDates && propSelectedDates.length > 0) {
      setSelectedDates(propSelectedDates);
    }
  }, [propSelectedDates]);

  // Generate time slots based on clinic settings
  const generateTimeSlots = () => {
    const slots = [];
    const start = clinicSettings.startTime.split(':').map(Number);
    const end = clinicSettings.endTime.split(':').map(Number);
    const interval = clinicSettings.interval;

    let currentHour = start[0];
    let currentMinute = start[1];
    const endTotalMinutes = end[0] * 60 + end[1];

    while (currentHour * 60 + currentMinute < endTotalMinutes) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if this time is in break times
      const isBreakTime = clinicSettings.breakTimes.some(breakTime => {
        const [breakStart, breakEnd] = breakTime.split('-');
        return timeStr >= breakStart && timeStr < breakEnd;
      });

      slots.push({
        time: timeStr,
        displayTime: formatTime(timeStr),
        isBreakTime
      });

      // Add interval
      currentMinute += interval;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    setTimeSlots(slots);
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate time slots when settings change
  useEffect(() => {
    generateTimeSlots();
  }, [clinicSettings]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('clinicSettings', JSON.stringify(clinicSettings));
  }, [clinicSettings]);

  // Fetch existing appointments for selected dates
  useEffect(() => {
    if (selectedDates.length > 0) {
      fetchAppointmentsForDates();
    }
  }, [selectedDates, token]);

  const fetchAppointmentsForDates = async () => {
    try {
      const appointmentData = {};
      
      for (const dateStr of selectedDates) {
        const response = await fetch(
          `${API_BASE_URL}/api/appointments/daily/${dateStr}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          appointmentData[dateStr] = data.data.appointments;
        }
      }
      
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Fetch appointments error:', error);
    }
  };

  // Check if time slot is available for a date
  const isTimeSlotAvailable = (dateStr, timeStr) => {
    const dayAppointments = appointments[dateStr] || [];
    return !dayAppointments.some(apt => apt.time === timeStr);
  };

  // Get appointment count for a time slot across all dates
  const getTimeSlotAppointmentCount = (timeStr) => {
    let count = 0;
    selectedDates.forEach(dateStr => {
      const dayAppointments = appointments[dateStr] || [];
      count += dayAppointments.filter(apt => apt.time === timeStr).length;
    });
    return count;
  };

  // Handle adding appointment to time slot
  const handleAddAppointment = (dateStr, timeStr) => {
    setSelectedSlot({ date: dateStr, time: timeStr });
    setShowPatientSearch(true);
    setSelectedPatient(null);
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  // Create appointment with selected patient
  const createAppointment = async () => {
    if (!selectedPatient || !selectedSlot) return;

    try {
      const appointmentData = {
        patientId: selectedPatient._id,
        date: selectedSlot.date,
        time: selectedSlot.time,
        visitType: appointmentType,
        status: 'scheduled',
        color: appointmentColor,
        notes: `${appointmentType} appointment scheduled for ${selectedPatient.firstName} ${selectedPatient.lastName}`
      };

      const response = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        // Refresh appointments
        await fetchAppointmentsForDates();

        // Reset form but keep modal open for adding more patients
        setSelectedPatient(null);
        setAppointmentType('Regular');
        setAppointmentColor('blue');

        // Show success message and ask if user wants to add another patient
        const addAnother = confirm(`✅ Appointment created for ${selectedPatient.firstName} ${selectedPatient.lastName}!\n\nWould you like to add another patient to this time slot?`);

        if (!addAnother) {
          setShowPatientSearch(false);
          setSelectedSlot(null);
        }
      } else {
        const errorData = await response.json();
        alert(`Error creating appointment: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Create appointment error:', error);
      alert('Error creating appointment. Please try again.');
    }
  };

  // Update clinic settings
  const updateClinicSettings = (newSettings) => {
    setClinicSettings(newSettings);
    // Save to localStorage for persistence
    localStorage.setItem('clinicSettings', JSON.stringify(newSettings));
    setShowSettings(false);
    alert('✅ Settings saved successfully!');
  };

  return (
    <div className="time-slot-selection">
      <div className="timeslot-header">
        <div className="header-left">
          <button
            className="btn-back"
            onClick={onBack}
          >
            ← Back to Calendar
          </button>
          <h1>⏰ Select Time Slots</h1>
        </div>
        <div className="header-right">
          <button 
            className="btn-settings"
            onClick={() => setShowSettings(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      <div className="selected-dates-info">
        <h3>Selected Dates ({selectedDates.length})</h3>
        <div className="dates-list">
          {selectedDates.map(dateStr => (
            <span key={dateStr} className="date-tag">
              {new Date(dateStr).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          ))}
        </div>
      </div>

      <div className="timeslots-container">
        <div className="timeslots-grid">
          {/* Header row with dates */}
          <div className="grid-header">
            <div className="time-column-header">Time</div>
            {selectedDates.map(dateStr => (
              <div key={dateStr} className="date-column-header">
                {new Date(dateStr).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {timeSlots.map(slot => (
            <div key={slot.time} className="timeslot-row">
              <div className={`time-label ${slot.isBreakTime ? 'break-time' : ''}`}>
                {slot.displayTime}
                {slot.isBreakTime && <span className="break-indicator">Break</span>}
              </div>
              
              {selectedDates.map(dateStr => {
                const isAvailable = isTimeSlotAvailable(dateStr, slot.time);
                const dayAppointments = appointments[dateStr] || [];
                const slotAppointments = dayAppointments.filter(apt => apt.time === slot.time);
                
                return (
                  <div key={`${dateStr}-${slot.time}`} className="timeslot-cell">
                    {slot.isBreakTime ? (
                      <div className="break-slot">
                        <span>Break Time</span>
                      </div>
                    ) : (
                      <div className="slot-content">
                        {/* Existing appointments */}
                        {slotAppointments.map(apt => {
                          const hexColor = colorMap[apt.color] || colorMap.blue;
                          return (
                            <div
                              key={apt._id}
                              className="existing-appointment"
                              style={{
                                borderLeft: `4px solid ${hexColor}`,
                                backgroundColor: `${hexColor}15`
                              }}
                            >
                              <div className="appointment-info">
                                <span className="patient-name">
                                  {apt.patientId?.firstName} {apt.patientId?.lastName}
                                </span>
                                <span className="visit-type" style={{ color: hexColor }}>
                                  {apt.visitType}
                                </span>
                              </div>
                              <button
                                className="add-more-btn"
                                onClick={() => handleAddAppointment(dateStr, slot.time)}
                                title="Add another patient to this time slot"
                              >
                                +
                              </button>
                            </div>
                          );
                        })}
                        
                        {/* Add appointment button */}
                        <button 
                          className="add-appointment-btn"
                          onClick={() => handleAddAppointment(dateStr, slot.time)}
                          title="Add appointment"
                        >
                          + Add
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content settings-modal">
            <div className="modal-header">
              <h3>⚙️ Clinic Schedule Settings</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="settings-form">
                <div className="form-group">
                  <label>Start Time:</label>
                  <input 
                    type="time" 
                    value={clinicSettings.startTime}
                    onChange={(e) => setClinicSettings({...clinicSettings, startTime: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>End Time:</label>
                  <input 
                    type="time" 
                    value={clinicSettings.endTime}
                    onChange={(e) => setClinicSettings({...clinicSettings, endTime: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Time Interval (minutes):</label>
                  <select 
                    value={clinicSettings.interval}
                    onChange={(e) => setClinicSettings({...clinicSettings, interval: parseInt(e.target.value)})}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Break Times (format: HH:MM-HH:MM, one per line):</label>
                  <textarea 
                    value={clinicSettings.breakTimes.join('\n')}
                    onChange={(e) => setClinicSettings({
                      ...clinicSettings, 
                      breakTimes: e.target.value.split('\n').filter(line => line.trim())
                    })}
                    placeholder="12:00-13:00&#10;15:00-15:15"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save"
                  onClick={() => updateClinicSettings(clinicSettings)}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Search Modal */}
      {showPatientSearch && (
        <div className="modal-overlay">
          <div className="modal-content patient-search-modal">
            <div className="modal-header">
              <h3>👤 Select Patient for Appointment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowPatientSearch(false);
                  setSelectedSlot(null);
                  setSelectedPatient(null);
                  setAppointmentType('Regular');
                  setAppointmentColor('blue');
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {selectedSlot && (
                <div className="appointment-details">
                  <h4>Appointment Details</h4>
                  <p><strong>Date:</strong> {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p><strong>Time:</strong> {formatTime(selectedSlot.time)}</p>
                </div>
              )}

              <div className="patient-search-section">
                <h4>Search for Patient</h4>
                <PatientSearch
                  token={token}
                  onPatientSelect={handlePatientSelect}
                  placeholder="Search by name, record number..."
                  showCreateNew={true}
                  onCreateNew={() => alert('Create new patient functionality would be implemented here')}
                  className="fullscreen"
                />
              </div>

              <div className="appointment-options">
                <h4>Appointment Details</h4>
                <div className="options-grid">
                  <div className="form-group">
                    <label>Appointment Type</label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="appointment-select"
                    >
                      <option value="New">New Patient</option>
                      <option value="Regular">Regular Visit</option>
                      <option value="Re-Eval">Re-Evaluation</option>
                      <option value="Walk-In">Walk-In</option>
                      <option value="Follow-Up">Follow-Up</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Decompression">Decompression</option>
                      <option value="Chiropractic">Chiropractic</option>
                      <option value="Evaluation">Evaluation</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Color</label>
                    <div className="color-picker">
                      <div className="color-presets">
                        {[
                          { name: 'blue', hex: '#3b82f6', label: 'Blue' },
                          { name: 'green', hex: '#10b981', label: 'Green' },
                          { name: 'yellow', hex: '#f59e0b', label: 'Yellow' },
                          { name: 'red', hex: '#ef4444', label: 'Red' },
                          { name: 'purple', hex: '#8b5cf6', label: 'Purple' },
                          { name: 'orange', hex: '#f97316', label: 'Orange' },
                          { name: 'white', hex: '#f8fafc', label: 'White' }
                        ].map(color => (
                          <button
                            key={color.name}
                            className={`color-preset ${appointmentColor === color.name ? 'active' : ''}`}
                            style={{ backgroundColor: color.hex, border: color.name === 'white' ? '2px solid #64748b' : 'none' }}
                            onClick={() => setAppointmentColor(color.name)}
                            title={color.label}
                          />
                        ))}
                      </div>
                      <div className="selected-color-info">
                        Selected: <span className="color-name">{appointmentColor.charAt(0).toUpperCase() + appointmentColor.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPatient && (
                <div className="selected-patient-preview">
                  <h4>Selected Patient</h4>
                  <div className="patient-card">
                    <div className="patient-avatar">
                      {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                    </div>
                    <div className="patient-info">
                      <div className="patient-name">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div className="patient-details">
                        <span>Record: #{selectedPatient.recordNumber}</span>
                        <span>DOB: {new Date(selectedPatient.dob + 'T12:00:00').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowPatientSearch(false);
                    setSelectedSlot(null);
                    setSelectedPatient(null);
                    setAppointmentType('Regular');
                    setAppointmentColor('blue');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-create-appointment"
                  onClick={createAppointment}
                  disabled={!selectedPatient}
                >
                  Create Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelection;
