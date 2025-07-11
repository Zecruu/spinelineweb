const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Ledger = require('../models/Ledger');
const AuditLog = require('../models/AuditLog');
const Patient = require('../models/Patient');
const { authenticateToken } = require('../middleware/auth');

// Complete checkout process
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      billingCodes,
      diagnosticCodes,
      carePackages,
      signature,
      paymentData,
      totalAmount,
      checkoutTime,
      processedBy
    } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !signature || !paymentData || totalAmount === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields for checkout completion'
      });
    }

    // Find the appointment and populate patient with referral info
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      clinicId: req.user.clinicId
    }).populate('patientId', 'firstName lastName recordNumber referral');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    const patient = appointment.patientId;

    // Update appointment status to checked out
    appointment.status = 'checked-out';
    appointment.checkOutTime = checkoutTime || new Date();
    appointment.paymentMethod = paymentData.method;
    appointment.totalAmount = totalAmount;
    appointment.signature = signature;
    appointment.processedBy = processedBy || req.user.id;

    await appointment.save();

    // Create ledger entry
    const ledgerEntry = new Ledger({
      appointmentId,
      patientId,
      clinicId: req.user.clinicId,
      visitDate: checkoutTime || new Date(),
      visitType: appointment.visitType || 'Regular',
      providerId: appointment.providerId || req.user.id,
      providerName: req.user.name || req.user.username,
      billingCodes: billingCodes.map(code => ({
        code: code.code,
        description: code.description,
        units: code.units || 1,
        unitPrice: code.price,
        totalPrice: code.price * (code.units || 1),
        covered: code.insuranceCovered || false
      })),
      subtotal: totalAmount,
      totalAmount,
      paymentMethod: paymentData.method,
      amountPaid: paymentData.amount,
      changeGiven: paymentData.change || 0,
      signature: {
        data: signature,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        signedBy: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
      },
      visitNotes: `Checkout completed via SpineLine system. Diagnostic codes: ${diagnosticCodes.map(d => d.code).join(', ')}`,
      createdBy: processedBy || req.user.id,
      lastModifiedBy: processedBy || req.user.id
    });

    await ledgerEntry.save();

    // Create comprehensive audit log for compliance
    const auditLog = new AuditLog({
      clinicId: req.user.clinicId,
      patientId,
      appointmentId,
      ledgerEntryId: ledgerEntry._id,
      visitDate: checkoutTime || new Date(),
      visitType: appointment.visitType || 'Regular',
      providerId: appointment.providerId || req.user.id,
      providerName: req.user.name || req.user.username,

      // SOAP Notes (if provided in request)
      soapNote: req.body.soapNote || {
        subjective: req.body.visitNotes || '',
        objective: '',
        assessment: '',
        plan: '',
        isComplete: Boolean(req.body.soapNote?.isComplete)
      },

      // Billing and Diagnostic Codes
      billingCodes: billingCodes.map(code => ({
        code: code.code,
        description: code.description,
        units: code.units || 1,
        unitPrice: code.price,
        totalPrice: code.price * (code.units || 1),
        modifiers: code.modifiers || [],
        isPreAuthorized: code.preAuthorized || false
      })),

      diagnosticCodes: diagnosticCodes.map(code => ({
        code: code.code,
        description: code.description,
        isPrimary: code.isPrimary || false
      })),

      // Digital Signature
      signature: {
        data: signature,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        signedBy: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
        isValid: Boolean(signature)
      },

      // Payment Information
      payment: {
        method: paymentData.method,
        amount: paymentData.amount,
        copayAmount: paymentData.copay || 0,
        copayOverride: paymentData.copayOverride ? {
          originalAmount: paymentData.copayOverride.original,
          newAmount: paymentData.copayOverride.new,
          reason: paymentData.copayOverride.reason,
          authorizedBy: req.user.id
        } : undefined,
        insuranceClaim: paymentData.insurance ? {
          claimNumber: paymentData.insurance.claimNumber,
          preAuthNumber: paymentData.insurance.preAuthNumber,
          status: 'pending'
        } : undefined
      },

      // Care Package Information
      carePackage: carePackages.length > 0 ? {
        packageId: carePackages[0].packageId,
        packageName: carePackages[0].packageName,
        visitsUsed: carePackages[0].visitsUsed || 1,
        visitsRemaining: carePackages[0].visitsRemaining
      } : undefined,

      // Audit Trail
      auditEvents: [{
        eventType: 'created',
        timestamp: new Date(),
        userId: req.user.id,
        description: 'Audit log created during checkout process',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }],

      createdBy: req.user.id
    });

    await auditLog.save();

    // Handle referral bonus automation
    let bonusProcessed = false;
    if (patient.referral && patient.referral.referredBy && !patient.referral.bonusPaid) {
      try {
        // Update the patient's referral bonus status
        await Patient.findByIdAndUpdate(patient._id, {
          'referral.bonusPaid': true,
          'referral.payoutDate': new Date(),
          'referral.payoutHandledBy': req.user.id
        });

        // Add referral bonus event to audit log
        auditLog.auditEvents.push({
          eventType: 'referral_bonus_triggered',
          timestamp: new Date(),
          userId: req.user.id,
          description: `Referral bonus triggered for patient ${patient.firstName} ${patient.lastName}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            referredPatientId: patient._id,
            referrerPatientId: patient.referral.referredBy,
            bonusAmount: patient.referral.payoutAmount || 0
          }
        });

        await auditLog.save();
        bonusProcessed = true;

        console.log(`Referral bonus processed for patient ${patient.firstName} ${patient.lastName} (${patient._id})`);
      } catch (bonusError) {
        console.error('Error processing referral bonus:', bonusError);
        // Don't fail the checkout if bonus processing fails
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Checkout completed successfully',
      data: {
        appointmentId,
        ledgerEntryId: ledgerEntry._id,
        auditLogId: auditLog._id,
        checkoutTime: appointment.checkOutTime,
        totalAmount,
        paymentMethod: paymentData.method,
        bonusProcessed
      }
    });

  } catch (error) {
    console.error('Checkout completion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get checkout summary for an appointment
router.get('/summary/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const ledgerEntry = await Ledger.findOne({
      appointmentId,
      clinicId: req.user.clinicId
    }).populate('patientId', 'firstName lastName recordNumber')
      .populate('processedBy', 'name username');

    if (!ledgerEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Checkout summary not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        checkoutSummary: ledgerEntry
      }
    });

  } catch (error) {
    console.error('Get checkout summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch checkout summary'
    });
  }
});

// Generate checkout receipt/PDF
router.get('/receipt/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const ledgerEntry = await Ledger.findOne({
      appointmentId,
      clinicId: req.user.clinicId
    }).populate('patientId', 'firstName lastName recordNumber phone email')
      .populate('processedBy', 'name username');

    if (!ledgerEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Receipt not found'
      });
    }

    // Format receipt data
    const receiptData = {
      receiptNumber: ledgerEntry._id.toString().slice(-8).toUpperCase(),
      date: ledgerEntry.date,
      patient: ledgerEntry.patientId,
      billingCodes: ledgerEntry.billingCodes,
      diagnosticCodes: ledgerEntry.diagnosticCodes,
      totalAmount: ledgerEntry.totalAmount,
      paymentMethod: ledgerEntry.paymentMethod,
      amountPaid: ledgerEntry.amountPaid,
      changeDue: ledgerEntry.changeDue,
      processedBy: ledgerEntry.processedBy,
      clinic: req.user.clinic
    };

    res.status(200).json({
      status: 'success',
      data: {
        receipt: receiptData
      }
    });

  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate receipt'
    });
  }
});

module.exports = router;
