const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');

// Get referral statistics for clinic
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Patient.aggregate([
      { $match: { clinicId: req.user.clinicId } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: { $cond: [{ $ne: ['$referral.referredBy', null] }, 1, 0] } },
          paidBonuses: { $sum: { $cond: ['$referral.bonusPaid', 1, 0] } },
          pendingBonuses: { $sum: { $cond: [{ $and: [{ $ne: ['$referral.referredBy', null] }, { $eq: ['$referral.bonusPaid', false] }] }, 1, 0] } },
          totalPayoutAmount: { $sum: { $cond: ['$referral.bonusPaid', '$referral.payoutAmount', 0] } },
          expiredReferrals: { $sum: { $cond: [{ $lt: ['$referral.expirationDate', new Date()] }, 1, 0] } }
        }
      }
    ]);

    const referralStats = stats[0] || {
      totalReferrals: 0,
      paidBonuses: 0,
      pendingBonuses: 0,
      totalPayoutAmount: 0,
      expiredReferrals: 0
    };

    res.status(200).json({
      status: 'success',
      data: referralStats
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral statistics'
    });
  }
});

// Get pending bonus payouts
router.get('/pending-bonuses', authenticateToken, async (req, res) => {
  try {
    const pendingBonuses = await Patient.find({
      clinicId: req.user.clinicId,
      'referral.referredBy': { $ne: null },
      'referral.bonusPaid': false
    })
    .populate('referral.referredBy', 'firstName lastName recordNumber')
    .select('firstName lastName recordNumber referral createdAt')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: pendingBonuses
    });

  } catch (error) {
    console.error('Get pending bonuses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending bonuses'
    });
  }
});

// Process manual bonus payout
router.post('/process-bonus/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { payoutAmount, notes } = req.body;

    const patient = await Patient.findOne({
      _id: patientId,
      clinicId: req.user.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    if (!patient.referral?.referredBy || patient.referral.bonusPaid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid referral or bonus already paid'
      });
    }

    // Update referral bonus status
    patient.referral.bonusPaid = true;
    patient.referral.payoutDate = new Date();
    patient.referral.payoutHandledBy = req.user.id;
    patient.referral.payoutAmount = payoutAmount || 0;
    if (notes) {
      patient.referral.notes = (patient.referral.notes || '') + `\n[${new Date().toLocaleDateString()}] Manual bonus payout: ${notes}`;
    }

    await patient.save();

    // Create audit log entry
    const auditEntry = new AuditLog({
      clinicId: req.user.clinicId,
      patientId: patient._id,
      visitDate: new Date(),
      visitType: 'Manual Bonus Processing',
      providerId: req.user.id,
      providerName: req.user.name || req.user.username,
      
      auditEvents: [{
        eventType: 'manual_bonus_payout',
        timestamp: new Date(),
        userId: req.user.id,
        description: `Manual referral bonus payout processed for ${patient.firstName} ${patient.lastName}`,
        metadata: {
          referredPatientId: patient._id,
          referrerPatientId: patient.referral.referredBy,
          bonusAmount: payoutAmount || 0,
          notes: notes || ''
        }
      }],
      
      createdBy: req.user.id
    });

    await auditEntry.save();

    res.status(200).json({
      status: 'success',
      message: 'Bonus payout processed successfully',
      data: {
        patientId: patient._id,
        payoutAmount: payoutAmount || 0,
        payoutDate: patient.referral.payoutDate
      }
    });

  } catch (error) {
    console.error('Process bonus error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process bonus payout'
    });
  }
});

// Get referral audit trail
router.get('/audit-trail/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const auditLogs = await AuditLog.find({
      clinicId: req.user.clinicId,
      patientId,
      'auditEvents.eventType': { $in: ['referral_bonus_triggered', 'manual_bonus_payout'] }
    })
    .populate('createdBy', 'name username')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: auditLogs
    });

  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit trail'
    });
  }
});

// Update referral information
router.put('/update/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { referralData } = req.body;

    const patient = await Patient.findOne({
      _id: patientId,
      clinicId: req.user.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Update referral information
    if (referralData) {
      patient.referral = {
        ...patient.referral,
        ...referralData,
        lastModifiedBy: req.user.id
      };
      
      await patient.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Referral information updated successfully',
      data: patient.referral
    });

  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update referral information'
    });
  }
});

// Get referral expiration report
router.get('/expiration-report', authenticateToken, async (req, res) => {
  try {
    const { daysAhead = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(daysAhead));

    const expiringReferrals = await Patient.find({
      clinicId: req.user.clinicId,
      'referral.expirationDate': {
        $gte: new Date(),
        $lte: futureDate
      },
      'referral.isActive': true
    })
    .select('firstName lastName recordNumber referral')
    .sort({ 'referral.expirationDate': 1 });

    res.status(200).json({
      status: 'success',
      data: expiringReferrals
    });

  } catch (error) {
    console.error('Get expiration report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expiration report'
    });
  }
});

module.exports = router;
