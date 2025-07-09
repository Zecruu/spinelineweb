const express = require('express');
const router = express.Router();
const BillingCode = require('../models/BillingCode');
const { authenticateToken } = require('../middleware/auth');

// Get billing codes for an appointment
router.get('/appointment/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const billingCodes = await BillingCode.find({ 
      appointmentId,
      clinicId: req.user.clinicId 
    }).populate('addedBy', 'name username');
    
    res.status(200).json({
      status: 'success',
      data: {
        billingCodes
      }
    });
  } catch (error) {
    console.error('Get billing codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch billing codes'
    });
  }
});

// Add a new billing code
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      appointmentId,
      code,
      description,
      price,
      units,
      insuranceCovered
    } = req.body;

    // Validate required fields
    if (!appointmentId || !code || !description || price === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: appointmentId, code, description, price'
      });
    }

    const billingCode = new BillingCode({
      appointmentId,
      code: code.trim().toUpperCase(),
      description: description.trim(),
      price: parseFloat(price),
      units: parseInt(units) || 1,
      insuranceCovered: Boolean(insuranceCovered),
      addedBy: req.user.id,
      clinicId: req.user.clinicId
    });

    await billingCode.save();
    await billingCode.populate('addedBy', 'name username');

    res.status(201).json({
      status: 'success',
      data: {
        billingCode
      }
    });
  } catch (error) {
    console.error('Add billing code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add billing code'
    });
  }
});

// Update a billing code
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      price,
      units,
      insuranceCovered
    } = req.body;

    const billingCode = await BillingCode.findOne({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!billingCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Billing code not found'
      });
    }

    // Update fields if provided
    if (code) billingCode.code = code.trim().toUpperCase();
    if (description) billingCode.description = description.trim();
    if (price !== undefined) billingCode.price = parseFloat(price);
    if (units !== undefined) billingCode.units = parseInt(units);
    if (insuranceCovered !== undefined) billingCode.insuranceCovered = Boolean(insuranceCovered);

    await billingCode.save();
    await billingCode.populate('addedBy', 'name username');

    res.status(200).json({
      status: 'success',
      data: {
        billingCode
      }
    });
  } catch (error) {
    console.error('Update billing code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update billing code'
    });
  }
});

// Delete a billing code
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const billingCode = await BillingCode.findOneAndDelete({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!billingCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Billing code not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Billing code deleted successfully'
    });
  } catch (error) {
    console.error('Delete billing code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete billing code'
    });
  }
});

// Get billing codes by clinic (for reports)
router.get('/clinic/all', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, code } = req.query;
    
    let query = { clinicId: req.user.clinicId };
    
    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Add code filter if provided
    if (code) {
      query.code = new RegExp(code, 'i');
    }
    
    const billingCodes = await BillingCode.find(query)
      .populate('appointmentId', 'date patientId')
      .populate('addedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        billingCodes
      }
    });
  } catch (error) {
    console.error('Get clinic billing codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinic billing codes'
    });
  }
});

module.exports = router;
