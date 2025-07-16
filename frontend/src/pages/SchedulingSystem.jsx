import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './SchedulingSystem.css';

// Visit type color mapping
const VISIT_TYPE_COLORS = {
  'Chiropractic': { color: 'blue', bgClass: 'bg-blue' },
  'Decompression': { color: 'green', bgClass: 'bg-green' },
  'Evaluation': { color: 'orange', bgClass: 'bg-orange' },
  'Re-Eval': { color: 'orange', bgClass: 'bg-orange' },
  'New': { color: 'purple', bgClass: 'bg-purple' },
  'Regular': { color: 'blue', bgClass: 'bg-blue' },
  'Follow-Up': { color: 'yellow', bgClass: 'bg-yellow' },
  'Consultation': { color: 'red', bgClass: 'bg-red' }
};

// Time slots for scheduling
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

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
    visitType: 'Chiropractic',
    patientId: '',
    color: 'blue',
    notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

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
        `${API_BASE_URL}/api/appointments/calendar/${year}/${month}?${params}`,
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
        `${API_BASE_URL}/api/appointments/daily/${dateStr}`,
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
      const response = await fetch(`${API_BASE_URL}/api/patients?limit=500`, {
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

  // Handle patient search
  const handlePatientSearch = (searchTerm) => {
    setPatientSearch(searchTerm);
    if (searchTerm.length >= 2) {
      const filtered = patients.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.recordNumber?.toString().includes(searchTerm)
      );
      setFilteredPatients(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredPatients([]);
    }
  };

  // Select patient from search
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setAppointmentDetails({...appointmentDetails, patientId: patient._id});
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setFilteredPatients([]);
    setShowPatientSearch(false);
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

  // Get dominant visit type for a date
  const getDominantVisitType = (dateStr) => {
    const dayAppointments = monthlyAppointments[dateStr] || [];
    if (dayAppointments.length === 0) return null;

    // Count visit types
    const typeCounts = {};
    dayAppointments.forEach(apt => {
      const type = apt.visitType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Find most common type
    let dominantType = null;
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return dominantType;
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
      const dominantType = getDominantVisitType(dateStr);
      const isPastDate = currentDateObj < new Date().setHours(0, 0, 0, 0);

      days.push({
        date: new Date(currentDateObj),
        dateStr,
        day: currentDateObj.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        appointmentCount,
        dominantType,
        isPastDate
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date, dayData) => {
    // Don't allow selection of past dates for booking
    if (showBookingFlow && dayData.isPastDate) {
      return;
    }

    if (showBookingFlow) {
      // Multi-date selection for booking
      const dateStr = date.toISOString().split('T')[0];
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter(d => d !== dateStr));
        // Remove time selection for this date
        const newTimes = { ...selectedTimes };
        delete newTimes[dateStr];
        setSelectedTimes(newTimes);
      } else {
        setSelectedDates([...selectedDates, dateStr]);
      }
    } else {
      // Check if date has appointments to show day modal
      if (dayData.appointmentCount > 0) {
        setSelectedDate(date);
        setShowDayModal(true);
        fetchDailyAppointments(date);
      } else {
        // Single date selection for day view
        setSelectedDate(date);
      }
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

    // Generate 30-minute intervals from 8:00 AM to 6:30 PM
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // Stop at 6:00 PM

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const appointments = dailyAppointments.filter(apt => apt.time === timeStr);

        slots.push({
          time: timeStr,
          displayTime: formatTime(timeStr),
          appointments
        });
      }
    }

    // Add any appointments that don't fall on standard time slots
    const standardTimes = slots.map(slot => slot.time);
    const orphanedAppointments = dailyAppointments.filter(apt => !standardTimes.includes(apt.time));

    orphanedAppointments.forEach(apt => {
      slots.push({
        time: apt.time,
        displayTime: formatTime(apt.time),
        appointments: [apt]
      });
    });

    // Sort slots by time
    slots.sort((a, b) => a.time.localeCompare(b.time));

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

      // Auto-assign color based on visit type
      const autoColor = VISIT_TYPE_COLORS[appointmentDetails.visitType]?.color || 'blue';

      for (const dateStr of selectedDates) {
        const timeStr = selectedTimes[dateStr];
        if (timeStr) {
          appointments.push({
            patientId: appointmentDetails.patientId,
            date: dateStr,
            time: timeStr,
            visitType: appointmentDetails.visitType,
            color: autoColor,
            notes: appointmentDetails.notes,
            type: appointmentDetails.visitType.toLowerCase(),
            status: 'scheduled'
          });
        }
      }

      // Create all appointments
      for (const appointment of appointments) {
        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
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
      resetBookingFlow();

      // Show success message
      alert(`Successfully scheduled ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`);

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

  // Reset booking flow
  const resetBookingFlow = () => {
    setShowBookingFlow(false);
    setSelectedDates([]);
    setSelectedTimes({});
    setBookingStep(1);
    setAppointmentDetails({
      visitType: 'Chiropractic',
      patientId: '',
      color: 'blue',
      notes: ''
    });
    setSelectedPatient(null);
    setPatientSearch('');
    setFilteredPatients([]);
    setShowPatientSearch(false);
  };

  // Handle appointment click for editing
  const handleAppointmentClick = (appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
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
              <option value="Chiropractic">Chiropractic</option>
              <option value="Decompression">Decompression</option>
              <option value="Evaluation">Evaluation</option>
              <option value="Re-Eval">Re-Evaluation</option>
              <option value="New">New Patient</option>
              <option value="Regular">Regular</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Consultation">Consultation</option>
            </select>
          </div>
          <button 
            className={`btn-book ${showBookingFlow ? 'active' : ''}`}
            onClick={() => {
              if (showBookingFlow) {
                resetBookingFlow();
              } else {
                setShowBookingFlow(true);
                setBookingStep(1);
              }
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
            ←
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
            →
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const dominantColorClass = day.dominantType ? VISIT_TYPE_COLORS[day.dominantType]?.bgClass : '';
              return (
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
                  } ${
                    day.appointmentCount > 0 ? dominantColorClass : ''
                  } ${
                    showBookingFlow && day.isPastDate ? 'past-date' : ''
                  }`}
                  onClick={() => day.isCurrentMonth && handleDateSelect(day.date, day)}
                  title={day.dominantType ? `Dominant type: ${day.dominantType}` : ''}
                >
                  <div className="day-number">{day.day}</div>
                  {day.appointmentCount > 0 && (
                    <div className="appointment-count">
                      {day.appointmentCount} patient{day.appointmentCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {day.dominantType && (
                    <div className="dominant-type">
                      {day.dominantType}
                    </div>
                  )}
                </div>
              );
            })}
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
                    <h4>{new Date(dateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</h4>
                    <select
                      value={selectedTimes[dateStr] || ''}
                      onChange={(e) => handleTimeSelect(dateStr, e.target.value)}
                      className="time-dropdown"
                    >
                      <option value="">Select Time</option>
                      {TIME_SLOTS.map(timeStr => (
                        <option key={timeStr} value={timeStr}>
                          {formatTime(timeStr)}
                        </option>
                      ))}
                    </select>
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
                  Next: Patient Search
                </button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="booking-step">
              <p>Search for patient:</p>
              <div className="patient-search-section">
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Search by name, phone, or record number..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="patient-search-input"
                  />
                  {filteredPatients.length > 0 && (
                    <div className="search-results">
                      {filteredPatients.map(patient => (
                        <div
                          key={patient._id}
                          className="search-result-item"
                          onClick={() => selectPatient(patient)}
                        >
                          <div className="patient-name">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="patient-details">
                            #{patient.recordNumber} • {patient.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="selected-patient-info">
                    <h4>Selected Patient:</h4>
                    <div className="patient-card">
                      <div className="patient-name">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div className="patient-details">
                        Record #: {selectedPatient.recordNumber}<br/>
                        Phone: {selectedPatient.phone}<br/>
                        {selectedPatient.insurance?.primary?.company && (
                          <>Insurance: {selectedPatient.insurance.primary.company}</>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="btn-add-patient"
                  onClick={() => alert('Add New Patient functionality coming soon!')}
                >
                  + Add New Patient
                </button>
              </div>

              <div className="appointment-form">
                <div className="form-group">
                  <label>Visit Type:</label>
                  <select
                    value={appointmentDetails.visitType}
                    onChange={(e) => {
                      const newVisitType = e.target.value;
                      const autoColor = VISIT_TYPE_COLORS[newVisitType]?.color || 'blue';
                      setAppointmentDetails({
                        ...appointmentDetails,
                        visitType: newVisitType,
                        color: autoColor
                      });
                    }}
                  >
                    <option value="Chiropractic">Chiropractic</option>
                    <option value="Decompression">Decompression</option>
                    <option value="Evaluation">Evaluation</option>
                    <option value="Re-Eval">Re-Evaluation</option>
                    <option value="New">New Patient</option>
                    <option value="Regular">Regular</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                  <div className="color-preview">
                    Color: <span className={`color-dot ${appointmentDetails.color}`}></span>
                    {appointmentDetails.visitType}
                  </div>
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
                  disabled={!selectedPatient}
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

              {selectedPatient && (
                <div className="confirmation-patient">
                  <h4>Patient: {selectedPatient.firstName} {selectedPatient.lastName}</h4>
                  <p>Record #: {selectedPatient.recordNumber} • Phone: {selectedPatient.phone}</p>
                </div>
              )}

              <div className="appointment-summary">
                {selectedDates.map(dateStr => (
                  <div key={dateStr} className={`summary-item ${VISIT_TYPE_COLORS[appointmentDetails.visitType]?.bgClass}`}>
                    <div className="summary-date">
                      {new Date(dateStr).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="summary-time">
                      {formatTime(selectedTimes[dateStr])}
                    </div>
                    <div className="summary-type">
                      {appointmentDetails.visitType}
                    </div>
                    <div className="summary-color">
                      <span className={`color-dot ${appointmentDetails.color}`}></span>
                    </div>
                  </div>
                ))}
              </div>

              {appointmentDetails.notes && (
                <div className="summary-notes">
                  <strong>Notes:</strong> {appointmentDetails.notes}
                </div>
              )}

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
                  {loading ? 'Creating...' : `Confirm ${selectedDates.length} Appointment${selectedDates.length > 1 ? 's' : ''}`}
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

      {/* Day Appointments Modal */}
      {showDayModal && selectedDate && (
        <div className="modal-overlay">
          <div className="modal-content day-modal">
            <div className="modal-header">
              <h3>
                📅 {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowDayModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="day-appointments-list">
                {dailyAppointments.length === 0 ? (
                  <p className="no-appointments">No appointments scheduled for this day.</p>
                ) : (
                  dailyAppointments.map(appointment => (
                    <div
                      key={appointment._id}
                      className={`appointment-item ${getAppointmentColor(appointment)}`}
                    >
                      <div className="appointment-time">
                        {formatTime(appointment.time)}
                      </div>
                      <div className="appointment-details">
                        <div className="patient-name">
                          {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                        </div>
                        <div className="visit-type">
                          {appointment.visitType} • Status: {appointment.status}
                        </div>
                        {appointment.notes && (
                          <div className="appointment-notes">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                      <div className="appointment-actions">
                        <button
                          className="btn-edit-small"
                          onClick={() => {
                            setEditingAppointment(appointment);
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-reschedule-small"
                          onClick={() => {
                            setRescheduleAppointment(appointment);
                            setRescheduleMode(true);
                          }}
                        >
                          📅
                        </button>
                        <button
                          className="btn-cancel-small"
                          onClick={() => {
                            const reason = prompt('Reason for cancellation:');
                            if (reason) {
                              cancelAppointment(appointment._id, reason);
                            }
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Appointment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAppointment(null);
                }}
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
                  📅 {new Date(editingAppointment.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {formatTime(editingAppointment.time)}
                </p>
                <p>🏥 Visit Type: {editingAppointment.visitType}</p>
                <p>📊 Status: <span className="status-badge">{editingAppointment.status}</span></p>
                {editingAppointment.notes && (
                  <p>📝 Notes: {editingAppointment.notes}</p>
                )}
                <p>📞 Phone: {editingAppointment.patientId?.phone}</p>
                <p>🆔 Record #: {editingAppointment.patientId?.recordNumber}</p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-edit"
                  onClick={() => {
                    alert('Edit appointment details functionality coming soon!');
                  }}
                >
                  ✏️ Edit Details
                </button>
                <button
                  className="btn-reschedule"
                  onClick={() => {
                    setRescheduleAppointment(editingAppointment);
                    setRescheduleMode(true);
                    setShowEditModal(false);
                  }}
                >
                  📅 Reschedule
                </button>
                <button
                  className="btn-cancel-apt"
                  onClick={() => {
                    const reason = prompt('Reason for cancellation (optional):');
                    if (reason !== null) { // Allow empty string but not null (cancelled prompt)
                      cancelAppointment(editingAppointment._id, reason || 'No reason provided');
                    }
                  }}
                >
                  ❌ Cancel Appointment
                </button>
                {editingAppointment.status === 'scheduled' && (
                  <button
                    className="btn-checkin"
                    onClick={() => {
                      // TODO: Implement check-in functionality
                      alert('Check-in functionality will integrate with Today\'s Patients page');
                    }}
                  >
                    ✅ Check In Patient
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleMode && rescheduleAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setRescheduleMode(false);
                  setRescheduleAppointment(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="reschedule-info">
                <h4>
                  {rescheduleAppointment.patientId?.firstName} {rescheduleAppointment.patientId?.lastName}
                </h4>
                <p>
                  Current: {new Date(rescheduleAppointment.date).toLocaleDateString()} at {formatTime(rescheduleAppointment.time)}
                </p>
              </div>

              <div className="reschedule-form">
                <div className="form-group">
                  <label>New Date:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="reschedule-input"
                  />
                </div>
                <div className="form-group">
                  <label>New Time:</label>
                  <select className="reschedule-input">
                    <option value="">Select Time</option>
                    {TIME_SLOTS.map(timeStr => (
                      <option key={timeStr} value={timeStr}>
                        {formatTime(timeStr)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reason for Reschedule:</label>
                  <textarea
                    placeholder="Optional reason for rescheduling..."
                    className="reschedule-input"
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-back"
                  onClick={() => {
                    setRescheduleMode(false);
                    setRescheduleAppointment(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm"
                  onClick={() => {
                    alert('Reschedule functionality will be implemented with conflict detection');
                  }}
                >
                  Confirm Reschedule
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
