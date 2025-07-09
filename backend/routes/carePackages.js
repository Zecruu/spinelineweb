const express = require('express');
const router = express.Router();
const CarePackage = require('../models/CarePackage');
const { authenticateToken } = require('../middleware/auth');

// Get care packages for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const carePackages = await CarePackage.find({ 
      patientId,
      clinicId: req.user.clinicId,
      status: { $in: ['active', 'completed'] }
    }).populate('addedBy', 'name username')
      .populate('sessionHistory.usedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        carePackages
      }
    });
  } catch (error) {
    console.error('Get care packages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch care packages'
    });
  }
});

// Add a new care package
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      patientId,
      name,
      totalSessions,
      remainingSessions,
      packageType,
      price,
      linkedBillingCodes,
      purchaseDate,
      expirationDate
    } = req.body;

    // Validate required fields
    if (!patientId || !name || !totalSessions || !packageType || price === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: patientId, name, totalSessions, packageType, price'
      });
    }

    const carePackage = new CarePackage({
      patientId,
      name: name.trim(),
      totalSessions: parseInt(totalSessions),
      remainingSessions: parseInt(remainingSessions) || parseInt(totalSessions),
      packageType,
      price: parseFloat(price),
      linkedBillingCodes: linkedBillingCodes || [],
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      addedBy: req.user.id,
      clinicId: req.user.clinicId
    });

    await carePackage.save();
    await carePackage.populate('addedBy', 'name username');

    res.status(201).json({
      status: 'success',
      data: {
        carePackage
      }
    });
  } catch (error) {
    console.error('Add care package error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add care package'
    });
  }
});

// Use a session from a care package
router.post('/:id/use-session', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointmentId,
      billingCodes,
      notes
    } = req.body;

    const carePackage = await CarePackage.findOne({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!carePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Care package not found'
      });
    }

    if (carePackage.remainingSessions <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No remaining sessions in this care package'
      });
    }

    // Use the session
    carePackage.remainingSessions -= 1;
    carePackage.sessionHistory.push({
      appointmentId,
      billingCodes: billingCodes || [],
      usedBy: req.user.id,
      notes: notes || '',
      usedDate: new Date()
    });

    // Update status if completed
    if (carePackage.remainingSessions === 0) {
      carePackage.status = 'completed';
    }

    await carePackage.save();
    await carePackage.populate('addedBy', 'name username');
    await carePackage.populate('sessionHistory.usedBy', 'name username');

    res.status(200).json({
      status: 'success',
      data: {
        carePackage
      }
    });
  } catch (error) {
    console.error('Use session error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to use session'
    });
  }
});

// Update a care package
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      totalSessions,
      remainingSessions,
      packageType,
      price,
      linkedBillingCodes,
      expirationDate,
      status
    } = req.body;

    const carePackage = await CarePackage.findOne({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!carePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Care package not found'
      });
    }

    // Update fields if provided
    if (name) carePackage.name = name.trim();
    if (totalSessions !== undefined) carePackage.totalSessions = parseInt(totalSessions);
    if (remainingSessions !== undefined) carePackage.remainingSessions = parseInt(remainingSessions);
    if (packageType) carePackage.packageType = packageType;
    if (price !== undefined) carePackage.price = parseFloat(price);
    if (linkedBillingCodes) carePackage.linkedBillingCodes = linkedBillingCodes;
    if (expirationDate) carePackage.expirationDate = new Date(expirationDate);
    if (status) carePackage.status = status;

    await carePackage.save();
    await carePackage.populate('addedBy', 'name username');

    res.status(200).json({
      status: 'success',
      data: {
        carePackage
      }
    });
  } catch (error) {
    console.error('Update care package error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update care package'
    });
  }
});

// Delete a care package
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const carePackage = await CarePackage.findOneAndDelete({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!carePackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Care package not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Care package deleted successfully'
    });
  } catch (error) {
    console.error('Delete care package error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete care package'
    });
  }
});

// Get care packages by clinic (for reports)
router.get('/clinic/all', authenticateToken, async (req, res) => {
  try {
    const { status, packageType, startDate, endDate } = req.query;
    
    let query = { clinicId: req.user.clinicId };
    
    // Add filters if provided
    if (status) query.status = status;
    if (packageType) query.packageType = packageType;
    
    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const carePackages = await CarePackage.find(query)
      .populate('patientId', 'firstName lastName recordNumber')
      .populate('addedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        carePackages
      }
    });
  } catch (error) {
    console.error('Get clinic care packages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinic care packages'
    });
  }
});

module.exports = router;
