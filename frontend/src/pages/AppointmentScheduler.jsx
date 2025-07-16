import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './AppointmentScheduler.css';
import TimeSlotSelection from './TimeSlotSelection';

const AppointmentScheduler = ({ token, user }) => {
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'timeslots'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState({});
  const [dailyCounts, setDailyCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');

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

  // Load appointments when component mounts or date/filter changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    fetchMonthlyAppointments(year, month);
  }, [currentDate, visitTypeFilter, token]);

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
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
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dateStr = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday = currentDateObj.toDateString() === new Date().toDateString();
      const appointmentCount = dailyCounts[dateStr] || 0;
      const dominantType = getDominantVisitType(dateStr);
      const isPastDate = currentDateObj < new Date().setHours(0, 0, 0, 0);
      const isSelected = selectedDates.includes(dateStr);

      days.push({
        date: new Date(currentDateObj),
        dateStr,
        day: currentDateObj.getDate(),
        isCurrentMonth,
        isToday,
        appointmentCount,
        dominantType,
        isPastDate,
        isSelected
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (dateStr, dayData) => {
    // Don't allow selection of past dates
    if (dayData.isPastDate || !dayData.isCurrentMonth) {
      return;
    }

    if (selectedDates.includes(dateStr)) {
      // Remove date
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      // Add date
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // Remove selected date
  const removeSelectedDate = (dateStr) => {
    setSelectedDates(selectedDates.filter(d => d !== dateStr));
  };

  // Proceed to time slot selection
  const proceedToTimeSlots = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    // Switch to time slot view
    setCurrentView('timeslots');
  };

  // Go back to calendar
  const backToCalendar = () => {
    setCurrentView('calendar');
  };

  const calendarDays = generateCalendarDays();

  // Get appointments for selected dates
  const getSelectedDatesAppointments = () => {
    const appointments = [];
    selectedDates.forEach(dateStr => {
      const dateAppointments = monthlyAppointments[dateStr] || [];
      dateAppointments.forEach(apt => {
        appointments.push({
          ...apt,
          date: dateStr
        });
      });
    });

    // Sort by date and time
    appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return appointments;
  };

  // Handle appointment actions
  const handleEditAppointment = (appointment) => {
    // TODO: Implement edit appointment modal
    console.log('Edit appointment:', appointment);
    alert('Edit appointment functionality will be implemented');
  };

  const handleRescheduleAppointment = (appointment) => {
    // TODO: Implement reschedule appointment modal
    console.log('Reschedule appointment:', appointment);
    alert('Reschedule appointment functionality will be implemented');
  };

  const handleCancelAppointment = async (appointment) => {
    if (!confirm(`Are you sure you want to cancel the appointment for ${appointment.patientId?.firstName} ${appointment.patientId?.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh appointments
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        fetchMonthlyAppointments(year, month);
        alert('Appointment cancelled successfully');
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel appointment error:', error);
      alert('Failed to cancel appointment');
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Render time slot selection if in timeslots view
  if (currentView === 'timeslots') {
    return (
      <TimeSlotSelection
        token={token}
        user={user}
        selectedDates={selectedDates}
        onBack={backToCalendar}
      />
    );
  }

  // Render calendar view
  return (
    <div className="appointment-scheduler">
      <div className="scheduler-header">
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
            className="btn-book"
            onClick={() => alert('This would show the full appointment list view')}
          >
            📋 View All Appointments
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
              const isSelected = selectedDates.includes(day.dateStr);
              return (
                <div
                  key={index}
                  className={`calendar-day ${
                    !day.isCurrentMonth ? 'other-month' : ''
                  } ${
                    day.isToday ? 'today' : ''
                  } ${
                    isSelected ? 'selected' : ''
                  } ${
                    day.isPastDate ? 'past-date' : ''
                  }`}
                  onClick={() => day.isCurrentMonth && handleDateSelect(day.dateStr, day)}
                >
                  <div className="day-number">{day.day}</div>
                  {day.appointmentCount > 0 && (
                    <div className="appointment-count">
                      {day.appointmentCount} patient{day.appointmentCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Dates Appointments Table */}
      {selectedDates.length > 0 && (
        <div className="appointments-table-container">
          <div className="table-header">
            <h3>
              {selectedDates.length === 1
                ? `Appointments for ${new Date(selectedDates[0] + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                : `Appointments for ${selectedDates.length} Selected Dates`
              }
            </h3>
            <button
              className="clear-selection-btn"
              onClick={() => setSelectedDates([])}
            >
              Clear Selection
            </button>
          </div>

          <div className="appointments-table">
            <div className="table-headers">
              <div className="header-cell">Time</div>
              <div className="header-cell">Patient</div>
              <div className="header-cell">Visit Type</div>
              <div className="header-cell">Doctor</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
            </div>

            <div className="table-body">
              {getSelectedDatesAppointments().length === 0 ? (
                <div className="no-appointments">
                  No appointments scheduled for selected date{selectedDates.length > 1 ? 's' : ''}
                </div>
              ) : (
                getSelectedDatesAppointments().map(appointment => (
                  <div key={appointment._id} className="table-row">
                    <div className="table-cell time-cell">
                      <div className="appointment-time">
                        {formatTime(appointment.time)}
                      </div>
                      <div className="appointment-date">
                        {new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="table-cell patient-cell">
                      <div className="patient-avatar">
                        {appointment.patientId?.firstName?.[0]}{appointment.patientId?.lastName?.[0]}
                      </div>
                      <div className="patient-info">
                        <div className="patient-name">
                          {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                        </div>
                        <div className="patient-record">
                          Record #{appointment.patientId?.recordNumber}
                        </div>
                      </div>
                    </div>
                    <div className="table-cell visit-type-cell">
                      <span className={`visit-type-badge ${getAppointmentColor(appointment)}`}>
                        {appointment.visitType}
                      </span>
                    </div>
                    <div className="table-cell doctor-cell">
                      {appointment.doctorName || 'Not Assigned'}
                    </div>
                    <div className="table-cell status-cell">
                      <span className={`status-badge ${appointment.status || 'scheduled'}`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                    </div>
                    <div className="table-cell actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditAppointment(appointment)}
                        title="Edit Appointment"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn reschedule-btn"
                        onClick={() => handleRescheduleAppointment(appointment)}
                        title="Reschedule"
                      >
                        📅
                      </button>
                      <button
                        className="action-btn cancel-btn"
                        onClick={() => handleCancelAppointment(appointment)}
                        title="Cancel Appointment"
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
      )}

      {/* Selected Dates Section */}
      {selectedDates.length > 0 && (
        <div className="selected-dates-section">
          <h3>Selected Dates ({selectedDates.length})</h3>
          <div className="selected-dates-list">
            {selectedDates.map(dateStr => (
              <div key={dateStr} className="selected-date-item">
                <span className="date-text">
                  {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <button 
                  className="remove-date-btn"
                  onClick={() => removeSelectedDate(dateStr)}
                  title="Remove date"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button 
            className="btn-confirm"
            onClick={proceedToTimeSlots}
            disabled={selectedDates.length === 0}
          >
            Confirm Dates & Choose Time Slots →
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;
