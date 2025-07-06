const express = require('express');
const AppointmentHistory = require('../models/AppointmentHistory');
const { authenticateToken, clinicScopedMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and clinic scoping to all routes
router.use(authenticateToken);
router.use(clinicScopedMiddleware);

// Get appointment history for a specific appointment
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const history = await AppointmentHistory.getAppointmentHistory(req.params.appointmentId);

    res.status(200).json({
      status: 'success',
      data: {
        history,
        totalEntries: history.length
      }
    });

  } catch (error) {
    console.error('Get appointment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointment history'
    });
  }
});

// Get patient appointment history
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const history = await AppointmentHistory.getPatientHistory(
      req.clinicId,
      req.params.patientId,
      parseInt(limit)
    );

    res.status(200).json({
      status: 'success',
      data: {
        history,
        totalEntries: history.length
      }
    });

  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient history'
    });
  }
});

// Get clinic appointment statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await AppointmentHistory.getClinicStats(req.clinicId, start, end);

    // Transform stats into a more readable format
    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.status(200).json({
      status: 'success',
      data: {
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        statistics: statsMap,
        totalChanges: stats.reduce((total, stat) => total + stat.count, 0)
      }
    });

  } catch (error) {
    console.error('Get clinic stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinic statistics'
    });
  }
});

// Get recent appointment changes
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20, changeType } = req.query;
    
    const query = { clinicId: req.clinicId };
    if (changeType) {
      query.changeType = changeType;
    }

    const recentChanges = await AppointmentHistory.find(query)
      .populate('appointmentId', 'date time visitType')
      .populate('patientId', 'firstName lastName recordNumber')
      .populate('changedBy', 'username email profile.firstName profile.lastName')
      .sort({ changedAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        changes: recentChanges,
        totalEntries: recentChanges.length
      }
    });

  } catch (error) {
    console.error('Get recent changes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent changes'
    });
  }
});

// Create appointment history entry (usually called automatically)
router.post('/', async (req, res) => {
  try {
    const {
      appointmentId,
      changeType,
      reason,
      previousValues,
      newValues,
      rescheduleDetails,
      cancellationDetails
    } = req.body;

    const historyData = {
      clinicId: req.clinicId,
      appointmentId,
      patientId: previousValues?.patientId || newValues?.patientId,
      changeType,
      reason,
      previousValues,
      newValues,
      changedBy: req.user._id,
      changedAt: new Date()
    };

    if (rescheduleDetails) {
      historyData.rescheduleDetails = rescheduleDetails;
    }

    if (cancellationDetails) {
      historyData.cancellationDetails = cancellationDetails;
    }

    const historyEntry = new AppointmentHistory(historyData);
    await historyEntry.save();

    await historyEntry.populate('changedBy', 'username email');

    res.status(201).json({
      status: 'success',
      message: 'History entry created successfully',
      data: { historyEntry }
    });

  } catch (error) {
    console.error('Create history entry error:', error);
    
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
      message: 'Failed to create history entry'
    });
  }
});

module.exports = router;
