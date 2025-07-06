const express = require('express');
const Ledger = require('../models/Ledger');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { authenticateToken, clinicScopedMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and clinic scoping to all routes
router.use(authenticateToken);
router.use(clinicScopedMiddleware);

// Get ledger entries with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      patientId, 
      providerId,
      paymentStatus,
      page = 1, 
      limit = 50 
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { 
      clinicId: req.clinicId,
      isVoided: false
    };

    // Date range filter
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }

    // Patient filter
    if (patientId) {
      query.patientId = patientId;
    }

    // Provider filter
    if (providerId) {
      query.providerId = providerId;
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const entries = await Ledger.find(query)
      .populate('patientId', 'firstName lastName recordNumber phone email')
      .populate('providerId', 'username email profile.firstName profile.lastName')
      .populate('appointmentId', 'date time visitType')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ledger.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get ledger entries error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ledger entries'
    });
  }
});

// Get single ledger entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await Ledger.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    })
    .populate('patientId')
    .populate('providerId', 'username email profile.firstName profile.lastName')
    .populate('appointmentId')
    .populate('createdBy', 'username email')
    .populate('lastModifiedBy', 'username email');

    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Ledger entry not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { entry }
    });

  } catch (error) {
    console.error('Get ledger entry error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ledger entry'
    });
  }
});

// Create ledger entry (checkout process)
router.post('/', async (req, res) => {
  try {
    const {
      appointmentId,
      billingCodes,
      signature,
      paymentMethod,
      amountPaid,
      visitNotes,
      followUp,
      alerts
    } = req.body;

    // Validate appointment exists and belongs to clinic
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      clinicId: req.clinicId
    }).populate('patientId');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'checked-in' && appointment.status !== 'in-progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only checkout checked-in or in-progress appointments'
      });
    }

    // Calculate totals from billing codes
    let subtotal = 0;
    const processedBillingCodes = billingCodes.map(code => {
      const totalPrice = code.units * code.unitPrice;
      subtotal += totalPrice;
      return {
        ...code,
        totalPrice
      };
    });

    // Create ledger entry
    const ledgerData = {
      clinicId: req.clinicId,
      patientId: appointment.patientId._id,
      appointmentId: appointmentId,
      visitDate: appointment.date,
      visitType: appointment.visitType,
      providerId: appointment.providerId,
      providerName: appointment.providerName || 'Unknown Provider',
      billingCodes: processedBillingCodes,
      subtotal,
      totalAmount: subtotal, // Will be recalculated in pre-save
      paymentMethod,
      amountPaid: amountPaid || 0,
      signature: {
        data: signature.data,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        signedBy: appointment.patientId.firstName + ' ' + appointment.patientId.lastName
      },
      visitNotes,
      followUp,
      alerts: alerts || [],
      createdBy: req.user._id
    };

    const ledgerEntry = new Ledger(ledgerData);
    await ledgerEntry.save();

    // Update appointment status and billing info
    await appointment.checkOut(processedBillingCodes, signature.data, {
      method: paymentMethod,
      amount: amountPaid
    });

    // Populate the response
    await ledgerEntry.populate('patientId', 'firstName lastName recordNumber');
    await ledgerEntry.populate('appointmentId', 'date time visitType');

    res.status(201).json({
      status: 'success',
      message: 'Patient checked out successfully',
      data: { 
        ledgerEntry,
        appointment: {
          id: appointment._id,
          status: appointment.status,
          checkOutTime: appointment.checkOutTime
        }
      }
    });

  } catch (error) {
    console.error('Create ledger entry error:', error);
    
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
      message: 'Failed to create ledger entry'
    });
  }
});

// Update ledger entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await Ledger.findOne({
      _id: req.params.id,
      clinicId: req.clinicId,
      isVoided: false
    });

    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Ledger entry not found or has been voided'
      });
    }

    // Update fields
    Object.assign(entry, req.body);
    entry.lastModifiedBy = req.user._id;
    
    await entry.save();

    res.status(200).json({
      status: 'success',
      message: 'Ledger entry updated successfully',
      data: { entry }
    });

  } catch (error) {
    console.error('Update ledger entry error:', error);
    
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
      message: 'Failed to update ledger entry'
    });
  }
});

// Void ledger entry
router.post('/:id/void', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const entry = await Ledger.findOne({
      _id: req.params.id,
      clinicId: req.clinicId,
      isVoided: false
    });

    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Ledger entry not found or already voided'
      });
    }

    await entry.voidEntry(req.user._id, reason);

    res.status(200).json({
      status: 'success',
      message: 'Ledger entry voided successfully',
      data: { entry }
    });

  } catch (error) {
    console.error('Void ledger entry error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to void ledger entry'
    });
  }
});

// Get clinic revenue report
router.get('/reports/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const revenue = await Ledger.getClinicRevenue(req.clinicId, start, end);

    res.status(200).json({
      status: 'success',
      data: {
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        revenue: revenue[0] || {
          totalRevenue: 0,
          totalBilled: 0,
          totalVisits: 0,
          averageVisitValue: 0
        }
      }
    });

  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate revenue report'
    });
  }
});

// Get outstanding balances
router.get('/reports/outstanding', async (req, res) => {
  try {
    const outstandingBalances = await Ledger.getOutstandingBalances(req.clinicId);

    const totalOutstanding = outstandingBalances.reduce((total, entry) => {
      return total + entry.balance;
    }, 0);

    res.status(200).json({
      status: 'success',
      data: {
        entries: outstandingBalances,
        summary: {
          totalEntries: outstandingBalances.length,
          totalOutstanding
        }
      }
    });

  } catch (error) {
    console.error('Get outstanding balances error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch outstanding balances'
    });
  }
});

module.exports = router;
