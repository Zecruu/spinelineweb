import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import './ScheduleNextVisit.css';

const ScheduleNextVisit = ({ patientId, token }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState({});
  const [appointmentType, setAppointmentType] = useState('decompression');
  const [loading, setLoading] = useState(false);

  const appointmentTypes = {
    decompression: { name: 'Decompression', color: '#3b82f6' },
    chiropractic: { name: 'Chiropractic', color: '#10b981' },
    consultation: { name: 'Consultation', color: '#f59e0b' },
    followup: { name: 'Follow-up', color: '#8b5cf6' }
  };

  const timeOptions = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;
    
    const dateString = date.toISOString().split('T')[0];
    
    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter(d => d !== dateString));
      const newTimeSlots = { ...timeSlots };
      delete newTimeSlots[dateString];
      setTimeSlots(newTimeSlots);
    } else {
      setSelectedDates([...selectedDates, dateString]);
    }
  };

  const handleTimeSelect = (date, time) => {
    const dateString = date;
    setTimeSlots({
      ...timeSlots,
      [dateString]: time
    });
  };

  const handleScheduleAppointments = async () => {
    try {
      setLoading(true);
      
      const appointments = selectedDates.map(dateString => ({
        patientId,
        date: new Date(dateString),
        time: timeSlots[dateString] || '09:00',
        type: appointmentType,
        visitType: appointmentTypes[appointmentType].name,
        status: 'scheduled',
        reason: 'Follow-up appointment',
        color: appointmentType,
        createdBy: 'current-user' // Should be actual user ID
      }));

      const response = await fetch(`${API_BASE_URL}/api/appointments/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointments })
      });

      if (response.ok) {
        alert(`Successfully scheduled ${appointments.length} appointment(s)`);
        setShowModal(false);
        setSelectedDates([]);
        setTimeSlots({});
      } else {
        const errorData = await response.json();
        alert(`Failed to schedule appointments: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Schedule appointments error:', error);
      alert('Failed to schedule appointments');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="checkout-section">
      <h3>🗓 Schedule Next Visit</h3>
      <p>Schedule follow-up appointments for this patient</p>
      
      <button 
        className="btn-primary schedule-btn"
        onClick={() => setShowModal(true)}
      >
        Schedule Next Visit
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="schedule-modal">
            <div className="modal-header">
              <h3>Schedule Next Visit(s)</h3>
              <button 
                className="btn-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Appointment Type Selection */}
              <div className="appointment-type-section">
                <label className="form-label">Appointment Type:</label>
                <div className="appointment-types">
                  {Object.entries(appointmentTypes).map(([key, type]) => (
                    <button
                      key={key}
                      className={`appointment-type-btn ${appointmentType === key ? 'active' : ''}`}
                      style={{ 
                        backgroundColor: appointmentType === key ? type.color : 'transparent',
                        borderColor: type.color,
                        color: appointmentType === key ? 'white' : type.color
                      }}
                      onClick={() => setAppointmentType(key)}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="calendar-section">
                <div className="calendar-header">
                  <button onClick={() => navigateMonth(-1)}>‹</button>
                  <h4>
                    {currentDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h4>
                  <button onClick={() => navigateMonth(1)}>›</button>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  
                  <div className="calendar-days">
                    {getDaysInMonth(currentDate).map((date, index) => {
                      if (!date) return <div key={index} className="empty-day"></div>;
                      
                      const dateString = date.toISOString().split('T')[0];
                      const isSelected = selectedDates.includes(dateString);
                      const isPast = date < new Date().setHours(0, 0, 0, 0);
                      
                      return (
                        <div
                          key={index}
                          className={`calendar-day ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                          onClick={() => handleDateSelect(date)}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Selection for Selected Dates */}
              {selectedDates.length > 0 && (
                <div className="time-selection-section">
                  <h4>Select Times for Selected Dates:</h4>
                  {selectedDates.map(dateString => (
                    <div key={dateString} className="date-time-row">
                      <div className="date-label">
                        {formatDate(new Date(dateString))}
                      </div>
                      <select
                        className="time-select"
                        value={timeSlots[dateString] || ''}
                        onChange={(e) => handleTimeSelect(dateString, e.target.value)}
                      >
                        <option value="">Select Time</option>
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-success"
                onClick={handleScheduleAppointments}
                disabled={selectedDates.length === 0 || loading}
              >
                {loading ? 'Scheduling...' : `Schedule ${selectedDates.length} Appointment(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleNextVisit;
