const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { authenticateToken, clinicScopedMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and clinic scoping to all routes
router.use(authenticateToken);
router.use(clinicScopedMiddleware);

// Get today's appointments organized by status
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all appointments for today
    const appointments = await Appointment.find({
      clinicId: req.clinicId,
      date: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('patientId', 'firstName lastName recordNumber phone email dob gender')
    .sort({ time: 1 });

    // Organize by status
    const organized = {
      scheduled: appointments.filter(apt => apt.status === 'scheduled'),
      checkedIn: appointments.filter(apt => apt.status === 'checked-in'),
      inProgress: appointments.filter(apt => apt.status === 'in-progress'),
      checkedOut: appointments.filter(apt => apt.status === 'checked-out'),
      cancelled: appointments.filter(apt => apt.status === 'cancelled'),
      noShow: appointments.filter(apt => apt.status === 'no-show')
    };

    res.status(200).json({
      status: 'success',
      data: {
        date: today.toISOString().split('T')[0],
        appointments: organized,
        summary: {
          total: appointments.length,
          scheduled: organized.scheduled.length,
          checkedIn: organized.checkedIn.length,
          inProgress: organized.inProgress.length,
          checkedOut: organized.checkedOut.length,
          cancelled: organized.cancelled.length,
          noShow: organized.noShow.length
        }
      }
    });

  } catch (error) {
    console.error('Get today\'s appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch today\'s appointments'
    });
  }
});

// Get appointments for a specific date organized by status (similar to today endpoint)
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all appointments for the specified date
    const appointments = await Appointment.find({
      clinicId: req.clinicId,
      date: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('patientId', 'firstName lastName recordNumber phone email dob gender')
    .sort({ time: 1 });

    // Organize by status
    const organized = {
      scheduled: appointments.filter(apt => apt.status === 'scheduled'),
      checkedIn: appointments.filter(apt => apt.status === 'checked-in'),
      inProgress: appointments.filter(apt => apt.status === 'in-progress'),
      checkedOut: appointments.filter(apt => apt.status === 'checked-out'),
      cancelled: appointments.filter(apt => apt.status === 'cancelled'),
      noShow: appointments.filter(apt => apt.status === 'no-show')
    };

    res.status(200).json({
      status: 'success',
      data: {
        date: date,
        appointments: organized,
        summary: {
          total: appointments.length,
          scheduled: organized.scheduled.length,
          checkedIn: organized.checkedIn.length,
          inProgress: organized.inProgress.length,
          checkedOut: organized.checkedOut.length,
          cancelled: organized.cancelled.length,
          noShow: organized.noShow.length
        }
      }
    });

  } catch (error) {
    console.error('Get date appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments for date'
    });
  }
});

// Get appointments by date range
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      patientId, 
      providerId,
      page = 1, 
      limit = 50 
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { clinicId: req.clinicId };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Patient filter
    if (patientId) {
      query.patientId = patientId;
    }

    // Provider filter
    if (providerId) {
      query.providerId = providerId;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName recordNumber phone email')
      .populate('providerId', 'username email profile.firstName profile.lastName')
      .sort({ date: -1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments'
    });
  }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    })
    .populate('patientId')
    .populate('providerId', 'username email profile.firstName profile.lastName')
    .populate('createdBy', 'username email')
    .populate('lastModifiedBy', 'username email');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { appointment }
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointment'
    });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    console.log('Creating appointment - req.body:', req.body);
    console.log('Creating appointment - req.user:', req.user);
    console.log('Creating appointment - req.clinicId:', req.clinicId);

    const appointmentData = {
      ...req.body,
      clinicId: req.clinicId,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    console.log('Final appointment data:', appointmentData);

    // Validate patient exists and belongs to clinic
    const patient = await Patient.findOne({
      _id: appointmentData.patientId,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found in this clinic'
      });
    }

    // Check for scheduling conflicts
    const conflictingAppointment = await Appointment.findOne({
      clinicId: req.clinicId,
      date: appointmentData.date,
      time: appointmentData.time,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        status: 'error',
        message: 'Time slot already booked'
      });
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // Populate the response
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(201).json({
      status: 'success',
      message: 'Appointment created successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create appointment'
    });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check for scheduling conflicts if date/time is being changed
    if (req.body.date || req.body.time) {
      const newDate = req.body.date || appointment.date;
      const newTime = req.body.time || appointment.time;
      
      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        clinicId: req.clinicId,
        date: newDate,
        time: newTime,
        status: { $nin: ['cancelled', 'no-show'] }
      });

      if (conflictingAppointment) {
        return res.status(409).json({
          status: 'error',
          message: 'Time slot already booked'
        });
      }
    }

    // Update fields
    Object.assign(appointment, req.body);
    appointment.lastModifiedBy = req.user._id;

    // Handle confirmation timestamp
    if (req.body.confirmed !== undefined) {
      if (req.body.confirmed && !appointment.confirmed) {
        appointment.confirmedAt = new Date();
      } else if (!req.body.confirmed) {
        appointment.confirmedAt = null;
      }
    }

    await appointment.save();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment'
    });
  }
});

// Check in patient
router.post('/:id/check-in', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot check in appointment with status: ${appointment.status}`
      });
    }

    await appointment.checkIn();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Patient checked in successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check in patient'
    });
  }
});

// Uncheck patient (move from checked-in back to scheduled)
router.post('/:id/uncheck', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'checked-in') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot uncheck appointment with status: ${appointment.status}`
      });
    }

    // Update appointment status back to scheduled
    appointment.status = 'scheduled';
    appointment.checkInTime = null;
    appointment.lastModifiedBy = req.user._id;
    appointment.lastModified = new Date();

    await appointment.save();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Patient unchecked successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Uncheck error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to uncheck patient'
    });
  }
});

// Create walk-in appointment
router.post('/walk-in', async (req, res) => {
  try {
    const { patientId } = req.body;

    // Validate patient exists and belongs to clinic
    const patient = await Patient.findOne({
      _id: patientId,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found in this clinic'
      });
    }

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format

    const appointmentData = {
      clinicId: req.clinicId,
      patientId: patientId,
      date: now,
      time: timeString,
      type: 'walk-in',
      visitType: 'Walk-In',
      status: 'checked-in',
      checkInTime: now,
      reason: 'Walk-in visit',
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(201).json({
      status: 'success',
      message: 'Walk-in appointment created and checked in',
      data: { appointment }
    });

  } catch (error) {
    console.error('Create walk-in error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create walk-in appointment'
    });
  }
});

// Cancel appointment
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;
    appointment.lastModifiedBy = req.user._id;

    await appointment.save();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel appointment'
    });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Only allow deletion of scheduled appointments
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only delete scheduled appointments'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete appointment'
    });
  }
});

// Get monthly appointments for calendar view
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { visitType } = req.query;

    let query = {
      clinicId: req.clinicId,
      status: { $ne: 'cancelled' }
    };

    // Add visit type filter if specified
    if (visitType && visitType !== 'all') {
      query.visitType = visitType;
    }

    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    query.date = { $gte: startOfMonth, $lte: endOfMonth };

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName recordNumber')
      .sort({ date: 1, time: 1 });

    // Group appointments by date
    const appointmentsByDate = {};
    appointments.forEach(apt => {
      const dateKey = apt.date.toISOString().split('T')[0];
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    });

    // Calculate daily counts
    const dailyCounts = {};
    Object.keys(appointmentsByDate).forEach(date => {
      dailyCounts[date] = appointmentsByDate[date].length;
    });

    res.status(200).json({
      status: 'success',
      data: {
        appointments: appointmentsByDate,
        dailyCounts,
        month: parseInt(month),
        year: parseInt(year),
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    console.error('Get monthly appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch monthly appointments'
    });
  }
});

// Get daily appointments for day view
router.get('/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const appointmentDate = new Date(date);

    const appointments = await Appointment.getDailyAppointments(req.clinicId, appointmentDate);

    // Group appointments by time slot
    const timeSlots = {};
    appointments.forEach(apt => {
      if (!timeSlots[apt.time]) {
        timeSlots[apt.time] = [];
      }
      timeSlots[apt.time].push(apt);
    });

    res.status(200).json({
      status: 'success',
      data: {
        date: date,
        appointments,
        timeSlots,
        totalAppointments: appointments.length
      }
    });

  } catch (error) {
    console.error('Get daily appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch daily appointments'
    });
  }
});

// Check for scheduling conflicts
router.post('/check-conflicts', async (req, res) => {
  try {
    const { date, time, duration, excludeId } = req.body;

    const conflicts = await Appointment.checkConflicts(
      req.clinicId,
      date,
      time,
      duration,
      excludeId
    );

    res.status(200).json({
      status: 'success',
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length
      }
    });

  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check scheduling conflicts'
    });
  }
});

// Reschedule appointment
router.post('/:id/reschedule', async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check for conflicts at new time
    const conflicts = await Appointment.checkConflicts(
      req.clinicId,
      newDate,
      newTime,
      appointment.appointmentLength || 30,
      appointment._id
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Time slot conflicts with existing appointment',
        conflicts
      });
    }

    await appointment.reschedule(newDate, newTime, reason, req.user._id);
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Appointment rescheduled successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reschedule appointment'
    });
  }
});

// Get daily production report data
router.get('/reports/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all appointments for the specified date
    const appointments = await Appointment.find({
      clinicId: req.clinicId,
      date: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('patientId', 'firstName lastName recordNumber phone email dob gender')
    .sort({ time: 1 });

    // Get ledger entries for the same date
    const Ledger = require('../models/Ledger');
    const ledgerEntries = await Ledger.find({
      clinicId: req.clinicId,
      visitDate: { $gte: startOfDay, $lt: endOfDay },
      isVoided: false
    })
    .populate('patientId', 'firstName lastName recordNumber')
    .populate('appointmentId', 'time visitType');

    // Create a map of appointment ID to ledger entry for easy lookup
    const ledgerMap = {};
    ledgerEntries.forEach(entry => {
      if (entry.appointmentId) {
        ledgerMap[entry.appointmentId._id.toString()] = entry;
      }
    });

    // Organize appointments by status and enrich with billing data
    const enrichedAppointments = {
      scheduled: [],
      checkedIn: [],
      checkedOut: []
    };

    appointments.forEach(apt => {
      const ledgerEntry = ledgerMap[apt._id.toString()];
      const enrichedApt = {
        ...apt.toObject(),
        ledgerData: ledgerEntry || null,
        // Extract key billing info for easy access
        deductible: ledgerEntry?.billingCodes?.reduce((total, code) =>
          total + (code.insuranceCoverage?.deductible || 0), 0) || 0,
        insuranceProvider: ledgerEntry?.insurance?.primaryInsurance?.companyName || 'N/A',
        totalBilled: ledgerEntry?.totalAmount || apt.totalAmount || 0,
        amountPaid: ledgerEntry?.amountPaid || apt.amountPaid || 0,
        paymentMethod: ledgerEntry?.paymentMethod || apt.paymentMethod || 'N/A'
      };

      if (apt.status === 'scheduled') {
        enrichedAppointments.scheduled.push(enrichedApt);
      } else if (apt.status === 'checked-in' || apt.status === 'in-progress') {
        enrichedAppointments.checkedIn.push(enrichedApt);
      } else if (apt.status === 'checked-out') {
        enrichedAppointments.checkedOut.push(enrichedApt);
      }
    });

    // Calculate payment method breakdown
    const paymentBreakdown = {};
    ledgerEntries.forEach(entry => {
      const method = entry.paymentMethod || 'Not Specified';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (entry.amountPaid || 0);
    });

    // Calculate summary metrics
    const summary = {
      total: appointments.length,
      scheduled: enrichedAppointments.scheduled.length,
      checkedIn: enrichedAppointments.checkedIn.length,
      checkedOut: enrichedAppointments.checkedOut.length,
      totalRevenue: ledgerEntries.reduce((sum, entry) => sum + (entry.amountPaid || 0), 0),
      totalBilled: ledgerEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0),
      paymentBreakdown
    };

    res.status(200).json({
      status: 'success',
      data: {
        date: date,
        appointments: enrichedAppointments,
        ledgerEntries,
        summary,
        reportGenerated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate daily report'
    });
  }
});

// Update appointment status (for SOAP note workflow)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.user.clinicId
    });

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Update status
    appointment.status = status;
    appointment.lastModifiedBy = req.user._id;
    appointment.lastModified = new Date();

    // Set specific timestamps based on status
    if (status === 'in-progress') {
      appointment.inProgressTime = new Date().toTimeString().slice(0, 5);
    } else if (status === 'checked-out') {
      appointment.checkOutTime = new Date().toTimeString().slice(0, 5);
    }

    await appointment.save();
    await appointment.populate('patientId', 'firstName lastName recordNumber phone email');

    res.status(200).json({
      status: 'success',
      message: 'Appointment status updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment status'
    });
  }
});

module.exports = router;
