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
    const appointmentData = {
      ...req.body,
      clinicId: req.clinicId,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

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

module.exports = router;
