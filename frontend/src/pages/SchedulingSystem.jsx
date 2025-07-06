import { useState, useEffect } from 'react';
import './SchedulingSystem.css';

const SchedulingSystem = ({ token, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthlyAppointments, setMonthlyAppointments] = useState({});
  const [dailyCounts, setDailyCounts] = useState({});
  const [dailyAppointments, setDailyAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTimes, setSelectedTimes] = useState({});
  const [appointmentDetails, setAppointmentDetails] = useState({
    visitType: 'Regular',
    patientId: '',
    color: 'blue',
    notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Fetch monthly appointments
  const fetchMonthlyAppointments = async (year, month) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (visitTypeFilter !== 'all') {
        params.append('visitType', visitTypeFilter);
      }

      const response = await fetch(
        `http://localhost:5001/api/appointments/calendar/${year}/${month}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMonthlyAppointments(data.data.appointments);
        setDailyCounts(data.data.dailyCounts);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Fetch monthly appointments error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily appointments
  const fetchDailyAppointments = async (date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `http://localhost:5001/api/appointments/daily/${dateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDailyAppointments(data.data.appointments);
      } else {
        setError('Failed to fetch daily appointments');
      }
    } catch (error) {
      console.error('Fetch daily appointments error:', error);
      setError('Failed to fetch daily appointments');
    }
  };

  // Fetch patients for booking
  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/patients?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data.patients);
      }
    } catch (error) {
      console.error('Fetch patients error:', error);
    }
  };

  // Load appointments when component mounts or date/filter changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetchMonthlyAppointments(year, month);
    fetchPatients();
  }, [currentDate, visitTypeFilter, token]);

  // Load daily appointments when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchDailyAppointments(selectedDate);
    }
  }, [selectedDate, token]);

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null); // Clear selected date when changing months
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday = currentDateObj.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && currentDateObj.toDateString() === selectedDate.toDateString();
      const appointmentCount = dailyCounts[dateStr] || 0;

      days.push({
        date: new Date(currentDateObj),
        dateStr,
        day: currentDateObj.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        appointmentCount
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    if (showBookingFlow) {
      // Multi-date selection for booking
      const dateStr = date.toISOString().split('T')[0];
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter(d => d !== dateStr));
      } else {
        setSelectedDates([...selectedDates, dateStr]);
      }
    } else {
      // Single date selection for day view
      setSelectedDate(date);
    }
  };

  // Get appointment color class
  const getAppointmentColor = (appointment) => {
    const colorMap = {
      'blue': 'apt-blue',
      'green': 'apt-green',
      'white': 'apt-white',
      'yellow': 'apt-yellow',
      'red': 'apt-red',
      'purple': 'apt-purple',
      'orange': 'apt-orange'
    };
    return colorMap[appointment.color] || 'apt-blue';
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

  // Generate time slots for day view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const appointments = dailyAppointments.filter(apt => apt.time === timeStr);
      
      slots.push({
        time: timeStr,
        displayTime: formatTime(timeStr),
        appointments
      });
    }
    return slots;
  };

  const calendarDays = generateCalendarDays();
  // Handle time selection for booking
  const handleTimeSelect = (dateStr, timeStr) => {
    setSelectedTimes(prev => ({
      ...prev,
      [dateStr]: timeStr
    }));
  };

  // Create appointment
  const createAppointment = async () => {
    try {
      setLoading(true);
      const appointments = [];

      for (const dateStr of selectedDates) {
        const timeStr = selectedTimes[dateStr];
        if (timeStr) {
          appointments.push({
            patientId: appointmentDetails.patientId,
            date: dateStr,
            time: timeStr,
            visitType: appointmentDetails.visitType,
            color: appointmentDetails.color,
            notes: appointmentDetails.notes,
            type: appointmentDetails.visitType.toLowerCase(),
            status: 'scheduled'
          });
        }
      }

      // Create all appointments
      for (const appointment of appointments) {
        const response = await fetch('http://localhost:5001/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(appointment)
        });

        if (!response.ok) {
          throw new Error('Failed to create appointment');
        }
      }

      // Reset booking flow
      setShowBookingFlow(false);
      setSelectedDates([]);
      setSelectedTimes({});
      setBookingStep(1);
      setAppointmentDetails({
        visitType: 'Regular',
        patientId: '',
        color: 'blue',
        notes: ''
      });

      // Refresh calendar
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      fetchMonthlyAppointments(year, month);

    } catch (error) {
      console.error('Create appointment error:', error);
      setError('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment click for editing
  const handleAppointmentClick = (appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      const response = await fetch(`http://localhost:5001/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Refresh appointments
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        fetchMonthlyAppointments(year, month);
        if (selectedDate) {
          fetchDailyAppointments(selectedDate);
        }
        setShowEditModal(false);
      } else {
        setError('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel appointment error:', error);
      setError('Failed to cancel appointment');
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="scheduling-system">
      <div className="scheduling-header">
        <h1>📅 Appointment Scheduling</h1>
        <div className="header-controls">
          <div className="filter-controls">
            <label>Filter by Type:</label>
            <select
              value={visitTypeFilter}
              onChange={(e) => setVisitTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="New">New Patient</option>
              <option value="Regular">Regular</option>
              <option value="Re-Eval">Re-Evaluation</option>
              <option value="Decompression">Decompression</option>
              <option value="Consultation">Consultation</option>
            </select>
          </div>
          <button 
            className={`btn-book ${showBookingFlow ? 'active' : ''}`}
            onClick={() => {
              setShowBookingFlow(!showBookingFlow);
              setSelectedDates([]);
              setBookingStep(1);
            }}
          >
            {showBookingFlow ? 'Cancel Booking' : '+ Book Appointment'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Calendar Month View */}
      <div className="calendar-container">
        <div className="calendar-header">
          <button 
            className="nav-button"
            onClick={() => navigateMonth(-1)}
          >
            ← Previous
          </button>
          <h2>
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          <button 
            className="nav-button"
            onClick={() => navigateMonth(1)}
          >
            Next →
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${
                  !day.isCurrentMonth ? 'other-month' : ''
                } ${
                  day.isToday ? 'today' : ''
                } ${
                  day.isSelected ? 'selected' : ''
                } ${
                  showBookingFlow && selectedDates.includes(day.dateStr) ? 'booking-selected' : ''
                }`}
                onClick={() => day.isCurrentMonth && handleDateSelect(day.date)}
              >
                <div className="day-number">{day.day}</div>
                {day.appointmentCount > 0 && (
                  <div className="appointment-count">
                    {day.appointmentCount} patient{day.appointmentCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Flow */}
      {showBookingFlow && (
        <div className="booking-flow">
          <div className="booking-header">
            <h3>Book New Appointment - Step {bookingStep} of 4</h3>
            <div className="booking-progress">
              <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>1. Select Dates</div>
              <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>2. Choose Times</div>
              <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>3. Patient Details</div>
              <div className={`step ${bookingStep >= 4 ? 'active' : ''}`}>4. Confirm</div>
            </div>
          </div>
          
          {bookingStep === 1 && (
            <div className="booking-step">
              <p>Select one or more dates on the calendar above, then click Next.</p>
              <div className="selected-dates">
                <strong>Selected Dates:</strong>
                {selectedDates.length === 0 ? (
                  <span> None</span>
                ) : (
                  selectedDates.map(date => (
                    <span key={date} className="selected-date-tag">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))
                )}
              </div>
              <button 
                className="btn-next"
                disabled={selectedDates.length === 0}
                onClick={() => setBookingStep(2)}
              >
                Next: Choose Times
              </button>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="booking-step">
              <p>Select time slots for each selected date:</p>
              <div className="time-selection">
                {selectedDates.map(dateStr => (
                  <div key={dateStr} className="date-time-selection">
                    <h4>{new Date(dateStr).toLocaleDateString()}</h4>
                    <div className="time-slots">
                      {Array.from({ length: 11 }, (_, i) => {
                        const hour = 8 + i;
                        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                        const isSelected = selectedTimes[dateStr] === timeStr;
                        return (
                          <button
                            key={timeStr}
                            className={`time-slot ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleTimeSelect(dateStr, timeStr)}
                          >
                            {formatTime(timeStr)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="booking-actions">
                <button
                  className="btn-back"
                  onClick={() => setBookingStep(1)}
                >
                  Back
                </button>
                <button
                  className="btn-next"
                  disabled={Object.keys(selectedTimes).length !== selectedDates.length}
                  onClick={() => setBookingStep(3)}
                >
                  Next: Patient Details
                </button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="booking-step">
              <p>Enter appointment details:</p>
              <div className="appointment-form">
                <div className="form-group">
                  <label>Patient:</label>
                  <select
                    value={appointmentDetails.patientId}
                    onChange={(e) => setAppointmentDetails({...appointmentDetails, patientId: e.target.value})}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} (#{patient.recordNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Visit Type:</label>
                  <select
                    value={appointmentDetails.visitType}
                    onChange={(e) => setAppointmentDetails({...appointmentDetails, visitType: e.target.value})}
                  >
                    <option value="New">New Patient</option>
                    <option value="Regular">Regular</option>
                    <option value="Re-Eval">Re-Evaluation</option>
                    <option value="Decompression">Decompression</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color:</label>
                  <select
                    value={appointmentDetails.color}
                    onChange={(e) => setAppointmentDetails({...appointmentDetails, color: e.target.value})}
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="white">White</option>
                    <option value="yellow">Yellow</option>
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (Optional):</label>
                  <textarea
                    value={appointmentDetails.notes}
                    onChange={(e) => setAppointmentDetails({...appointmentDetails, notes: e.target.value})}
                    placeholder="Additional notes for the appointment..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="booking-actions">
                <button
                  className="btn-back"
                  onClick={() => setBookingStep(2)}
                >
                  Back
                </button>
                <button
                  className="btn-next"
                  disabled={!appointmentDetails.patientId}
                  onClick={() => setBookingStep(4)}
                >
                  Next: Confirm
                </button>
              </div>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="booking-step">
              <p>Review and confirm your appointments:</p>
              <div className="appointment-summary">
                {selectedDates.map(dateStr => (
                  <div key={dateStr} className="summary-item">
                    <div className="summary-date">
                      {new Date(dateStr).toLocaleDateString()}
                    </div>
                    <div className="summary-time">
                      {formatTime(selectedTimes[dateStr])}
                    </div>
                    <div className="summary-patient">
                      {patients.find(p => p._id === appointmentDetails.patientId)?.firstName} {patients.find(p => p._id === appointmentDetails.patientId)?.lastName}
                    </div>
                    <div className="summary-type">
                      {appointmentDetails.visitType}
                    </div>
                  </div>
                ))}
              </div>

              <div className="booking-actions">
                <button
                  className="btn-back"
                  onClick={() => setBookingStep(3)}
                >
                  Back
                </button>
                <button
                  className="btn-confirm"
                  disabled={loading}
                  onClick={createAppointment}
                >
                  {loading ? 'Creating...' : 'Confirm Appointments'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day View */}
      {selectedDate && !showBookingFlow && (
        <div className="day-view">
          <div className="day-view-header">
            <h3>
              📋 {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <span className="appointment-total">
              {dailyAppointments.length} appointment{dailyAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="time-slots-container">
            {timeSlots.map(slot => (
              <div key={slot.time} className="time-slot-row">
                <div className="time-label">
                  {slot.displayTime}
                </div>
                <div className="appointments-column">
                  {slot.appointments.length === 0 ? (
                    <div className="empty-slot">Available</div>
                  ) : (
                    slot.appointments.map(appointment => (
                      <div
                        key={appointment._id}
                        className={`appointment-block ${getAppointmentColor(appointment)}`}
                        title={`${appointment.patientId?.firstName} ${appointment.patientId?.lastName} - ${appointment.visitType}`}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="appointment-patient">
                          {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                        </div>
                        <div className="appointment-type">
                          {appointment.visitType}
                        </div>
                        {appointment.notes && (
                          <div className="appointment-notes">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Appointment</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="appointment-info">
                <h4>
                  {editingAppointment.patientId?.firstName} {editingAppointment.patientId?.lastName}
                </h4>
                <p>
                  {new Date(editingAppointment.date).toLocaleDateString()} at {formatTime(editingAppointment.time)}
                </p>
                <p>Visit Type: {editingAppointment.visitType}</p>
                {editingAppointment.notes && (
                  <p>Notes: {editingAppointment.notes}</p>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-edit"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit appointment:', editingAppointment._id);
                  }}
                >
                  ✏️ Edit Details
                </button>
                <button
                  className="btn-reschedule"
                  onClick={() => {
                    // TODO: Implement reschedule functionality
                    console.log('Reschedule appointment:', editingAppointment._id);
                  }}
                >
                  📅 Reschedule
                </button>
                <button
                  className="btn-cancel-apt"
                  onClick={() => {
                    const reason = prompt('Reason for cancellation:');
                    if (reason) {
                      cancelAppointment(editingAppointment._id, reason);
                    }
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingSystem;
