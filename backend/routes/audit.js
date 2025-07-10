const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');

// Get audit logs with filtering and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      startDate, 
      endDate,
      visitType,
      providerId,
      missingSignature,
      missingNotes,
      copayOverride,
      patientId 
    } = req.query;

    // Build query
    let query = { 
      clinicId: req.user.clinicId
    };

    // Add date range filter
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }

    // Add filters
    if (visitType) query.visitType = visitType;
    if (providerId) query.providerId = providerId;
    if (patientId) query.patientId = patientId;

    // Add compliance filters
    if (missingSignature === 'true') query['complianceFlags.missingSignature'] = true;
    if (missingNotes === 'true') query['complianceFlags.missingNotes'] = true;
    if (copayOverride === 'true') query['complianceFlags.copayOverride'] = true;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Build aggregation pipeline for search and population
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'providerId',
          foreignField: '_id',
          as: 'provider'
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$appointment', preserveNullAndEmptyArrays: true } }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'patient.firstName': { $regex: search, $options: 'i' } },
            { 'patient.lastName': { $regex: search, $options: 'i' } },
            { 'patient.recordNumber': { $regex: search, $options: 'i' } },
            { providerName: { $regex: search, $options: 'i' } },
            { 'billingCodes.code': { $regex: search, $options: 'i' } },
            { 'diagnosticCodes.code': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { visitDate: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const auditLogs = await AuditLog.aggregate(pipeline);

    res.status(200).json({
      status: 'success',
      data: {
        auditLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEntries: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs'
    });
  }
});

// Get single audit log details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await AuditLog.findOne({
      _id: id,
      clinicId: req.user.clinicId
    })
    .populate('patientId', 'firstName lastName recordNumber phone email dob')
    .populate('appointmentId', 'date time status')
    .populate('providerId', 'name username')
    .populate('createdBy', 'name username')
    .populate('lastModifiedBy', 'name username')
    .populate('auditEvents.userId', 'name username');

    if (!auditLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Audit log not found'
      });
    }

    // Add audit event for viewing
    await auditLog.addAuditEvent(
      'viewed',
      req.user.id,
      'Audit log viewed',
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      data: {
        auditLog
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit log'
    });
  }
});

// Create new audit log (typically called from checkout)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const auditData = {
      ...req.body,
      clinicId: req.user.clinicId,
      createdBy: req.user.id
    };

    const auditLog = new AuditLog(auditData);
    await auditLog.save();

    // Add initial audit event
    await auditLog.addAuditEvent(
      'created',
      req.user.id,
      'Audit log created',
      req.ip,
      req.get('User-Agent')
    );

    // Populate the response
    await auditLog.populate([
      { path: 'patientId', select: 'firstName lastName recordNumber' },
      { path: 'createdBy', select: 'name username' }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        auditLog
      }
    });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create audit log'
    });
  }
});

// Update audit log
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const auditLog = await AuditLog.findOne({
      _id: id,
      clinicId: req.user.clinicId,
      isLocked: false
    });

    if (!auditLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Audit log not found or is locked'
      });
    }

    // Store original data for audit trail
    const originalData = auditLog.toObject();
    
    // Update fields
    Object.assign(auditLog, req.body);
    auditLog.lastModifiedBy = req.user.id;
    
    await auditLog.save();

    // Add audit event for modification
    await auditLog.addAuditEvent(
      'modified',
      req.user.id,
      'Audit log modified',
      req.ip,
      req.get('User-Agent'),
      { original: originalData, updated: req.body }
    );

    res.status(200).json({
      status: 'success',
      data: {
        auditLog
      }
    });
  } catch (error) {
    console.error('Update audit log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update audit log'
    });
  }
});

// Lock audit log
router.post('/:id/lock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const auditLog = await AuditLog.findOne({
      _id: id,
      clinicId: req.user.clinicId,
      isLocked: false
    });

    if (!auditLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Audit log not found or already locked'
      });
    }

    await auditLog.lockRecord(req.user.id, reason || 'Manual lock');

    // Add audit event
    await auditLog.addAuditEvent(
      'flagged',
      req.user.id,
      `Record locked: ${reason || 'Manual lock'}`,
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Audit log locked successfully'
    });
  } catch (error) {
    console.error('Lock audit log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to lock audit log'
    });
  }
});

// Get compliance summary
router.get('/reports/compliance', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const compliance = await AuditLog.getComplianceSummary(req.user.clinicId, start, end);

    res.status(200).json({
      status: 'success',
      data: {
        compliance: compliance[0] || {
          totalRecords: 0,
          missingSignatures: 0,
          missingNotes: 0,
          copayOverrides: 0,
          lateDocumentation: 0,
          incompleteSOAP: 0,
          missingDiagnosis: 0
        },
        dateRange: { startDate: start, endDate: end }
      }
    });
  } catch (error) {
    console.error('Get compliance summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch compliance summary'
    });
  }
});

module.exports = router;
