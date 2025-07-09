const express = require('express');
const router = express.Router();
const DiagnosticCode = require('../models/DiagnosticCode');
const { authenticateToken } = require('../middleware/auth');

// Get diagnostic codes for an appointment
router.get('/appointment/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const diagnosticCodes = await DiagnosticCode.find({ 
      appointmentId,
      clinicId: req.user.clinicId 
    }).populate('addedBy', 'name username');
    
    res.status(200).json({
      status: 'success',
      data: {
        diagnosticCodes
      }
    });
  } catch (error) {
    console.error('Get diagnostic codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch diagnostic codes'
    });
  }
});

// Add a new diagnostic code
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      appointmentId,
      code,
      description,
      severity,
      laterality,
      notes
    } = req.body;

    // Validate required fields
    if (!appointmentId || !code || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: appointmentId, code, description'
      });
    }

    const diagnosticCode = new DiagnosticCode({
      appointmentId,
      code: code.trim().toUpperCase(),
      description: description.trim(),
      severity: severity || 'Moderate',
      laterality: laterality || 'N/A',
      notes: notes ? notes.trim() : '',
      addedBy: req.user.id,
      clinicId: req.user.clinicId
    });

    await diagnosticCode.save();
    await diagnosticCode.populate('addedBy', 'name username');

    res.status(201).json({
      status: 'success',
      data: {
        diagnosticCode
      }
    });
  } catch (error) {
    console.error('Add diagnostic code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add diagnostic code'
    });
  }
});

// Update a diagnostic code
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      severity,
      laterality,
      notes
    } = req.body;

    const diagnosticCode = await DiagnosticCode.findOne({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!diagnosticCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Diagnostic code not found'
      });
    }

    // Update fields if provided
    if (code) diagnosticCode.code = code.trim().toUpperCase();
    if (description) diagnosticCode.description = description.trim();
    if (severity) diagnosticCode.severity = severity;
    if (laterality) diagnosticCode.laterality = laterality;
    if (notes !== undefined) diagnosticCode.notes = notes.trim();

    await diagnosticCode.save();
    await diagnosticCode.populate('addedBy', 'name username');

    res.status(200).json({
      status: 'success',
      data: {
        diagnosticCode
      }
    });
  } catch (error) {
    console.error('Update diagnostic code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update diagnostic code'
    });
  }
});

// Delete a diagnostic code
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const diagnosticCode = await DiagnosticCode.findOneAndDelete({
      _id: id,
      clinicId: req.user.clinicId
    });

    if (!diagnosticCode) {
      return res.status(404).json({
        status: 'error',
        message: 'Diagnostic code not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Diagnostic code deleted successfully'
    });
  } catch (error) {
    console.error('Delete diagnostic code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete diagnostic code'
    });
  }
});

// Get diagnostic codes by clinic (for reports)
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
    
    const diagnosticCodes = await DiagnosticCode.find(query)
      .populate('appointmentId', 'date patientId')
      .populate('addedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        diagnosticCodes
      }
    });
  } catch (error) {
    console.error('Get clinic diagnostic codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinic diagnostic codes'
    });
  }
});

module.exports = router;
