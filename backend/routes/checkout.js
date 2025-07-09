const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Ledger = require('../models/Ledger');
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

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      clinicId: req.user.clinicId
    }).populate('patientId', 'firstName lastName recordNumber');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

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

    // Create audit record (for compliance)
    const auditRecord = {
      type: 'checkout_completed',
      appointmentId,
      patientId,
      clinicId: req.user.clinicId,
      timestamp: new Date(),
      data: {
        billingCodes: billingCodes.length,
        diagnosticCodes: diagnosticCodes.length,
        carePackagesAffected: carePackages.length,
        totalAmount,
        paymentMethod: paymentData.method,
        signatureCaptured: Boolean(signature),
        processedBy: processedBy || req.user.id
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      }
    };

    // Store audit record in ledger for now (could be separate audit collection)
    ledgerEntry.auditTrail = [auditRecord];
    await ledgerEntry.save();

    res.status(200).json({
      status: 'success',
      message: 'Checkout completed successfully',
      data: {
        appointmentId,
        ledgerEntryId: ledgerEntry._id,
        checkoutTime: appointment.checkOutTime,
        totalAmount,
        paymentMethod: paymentData.method
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
