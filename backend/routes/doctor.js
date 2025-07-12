const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const SOAPNote = require('../models/SOAPNote');
const { authenticateToken } = require('../middleware/auth');

// Get daily patients for doctor dashboard
router.get('/daily-patients', authenticateToken, async (req, res) => {
  try {
    const { date, providerId, patientType, searchTerm } = req.query;
    const clinicId = req.user.clinicId;

    // Parse the date to ensure proper comparison
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Build query for appointments
    const appointmentQuery = {
      clinicId,
      date: { $gte: startOfDay, $lt: endOfDay }, // Fixed: Use date range for proper matching
      status: { $in: ['checked-in', 'checked-out'] }
    };

    // Filter by provider if specified
    if (providerId) {
      appointmentQuery.providerId = providerId;
    }
    // Note: Removed automatic filtering by current user to show all clinic patients
    // This allows doctors to see all checked-in patients in their clinic

    // Fetch appointments with patient data
    let appointments = await Appointment.find(appointmentQuery)
      .populate({
        path: 'patientId',
        select: 'firstName lastName recordNumber alerts insuranceInfo referral',
        match: searchTerm ? {
          $or: [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { recordNumber: { $regex: searchTerm, $options: 'i' } }
          ]
        } : {}
      })
      .populate('providerId', 'name username')
      .sort({ time: 1 }); // Fixed: Use 'time' field instead of 'appointmentTime'

    // Filter out appointments where patient didn't match search
    appointments = appointments.filter(apt => apt.patientId);

    // Filter by visit type if specified
    if (patientType) {
      appointments = appointments.filter(apt => apt.visitType === patientType);
    }

    // Fetch SOAP notes for these appointments
    const appointmentIds = appointments.map(apt => apt._id);
    const soapNotes = await SOAPNote.find({
      appointmentId: { $in: appointmentIds }
    }).select('appointmentId isSigned createdAt');

    // Create SOAP notes lookup
    const soapNotesMap = {};
    soapNotes.forEach(note => {
      soapNotesMap[note.appointmentId.toString()] = note;
    });

    // Get diagnostic codes for these appointments
    const DiagnosticCode = require('../models/DiagnosticCode');
    const diagnosticCodes = await DiagnosticCode.find({
      appointmentId: { $in: appointmentIds }
    });

    // Create diagnostic codes lookup
    const diagnosticCodesMap = {};
    diagnosticCodes.forEach(code => {
      if (!diagnosticCodesMap[code.appointmentId.toString()]) {
        diagnosticCodesMap[code.appointmentId.toString()] = [];
      }
      diagnosticCodesMap[code.appointmentId.toString()].push(code);
    });

    // Process appointments and add additional data
    const processedAppointments = appointments.map(appointment => {
      const patient = appointment.patientId;
      const soapNote = soapNotesMap[appointment._id.toString()];
      const appointmentDiagnosticCodes = diagnosticCodesMap[appointment._id.toString()] || [];

      return {
        _id: appointment._id,
        appointmentTime: appointment.time, // Fixed: Use 'time' field
        checkOutTime: appointment.checkOutTime,
        visitType: appointment.visitType,
        status: appointment.status,
        firstName: patient.firstName,
        lastName: patient.lastName,
        recordNumber: patient.recordNumber,
        hasAlerts: patient.alerts && patient.alerts.length > 0,
        hasSOAPNote: !!soapNote,
        soapNote: soapNote ? {
          isSigned: soapNote.isSigned,
          createdAt: soapNote.createdAt
        } : null,
        needsReview: appointment.status === 'checked-out' && (!soapNote || !soapNote.isSigned),
        provider: appointment.providerId ? {
          name: appointment.providerId.name || appointment.providerId.username,
          id: appointment.providerId._id
        } : null,
        // Add billing and diagnostic information for checked-out patients
        billingCodes: appointment.billingCodes || [],
        diagnosticCodes: appointmentDiagnosticCodes.map(code => ({
          code: code.code,
          description: code.description,
          severity: code.severity,
          laterality: code.laterality
        })),
        totalAmount: appointment.totalAmount || 0,
        paymentMethod: appointment.paymentMethod || null,
        signature: appointment.signature ? {
          timestamp: appointment.signature.timestamp,
          isValid: !!appointment.signature.data
        } : null
      };
    });

    // Separate checked-in and checked-out patients
    const checkedIn = processedAppointments.filter(apt => apt.status === 'checked-in');
    const checkedOut = processedAppointments.filter(apt => apt.status === 'checked-out');

    res.status(200).json({
      status: 'success',
      data: {
        checkedIn,
        checkedOut,
        stats: {
          totalCheckedIn: checkedIn.length,
          totalCheckedOut: checkedOut.length,
          needsReview: checkedOut.filter(apt => apt.needsReview).length
        }
      }
    });

  } catch (error) {
    console.error('Get daily patients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch daily patients'
    });
  }
});

// Get patient encounter data
router.get('/encounter/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { appointmentId } = req.query;

    // Get patient with full details
    const patient = await Patient.findOne({
      _id: patientId,
      clinicId: req.user.clinicId
    }).populate('referral.referredBy', 'firstName lastName');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Get current appointment if specified
    let currentAppointment = null;
    if (appointmentId) {
      currentAppointment = await Appointment.findOne({
        _id: appointmentId,
        patientId,
        clinicId: req.user.clinicId
      }).populate('providerId', 'name username');
    }

    // Get recent appointments for history
    const recentAppointments = await Appointment.find({
      patientId,
      clinicId: req.user.clinicId,
      status: { $in: ['checked-out', 'completed'] }
    })
    .populate('providerId', 'name username')
    .sort({ date: -1 }) // Fixed: Use 'date' field
    .limit(10);

    // Get SOAP notes for recent appointments
    const recentAppointmentIds = recentAppointments.map(apt => apt._id);
    const soapNotes = await SOAPNote.find({
      appointmentId: { $in: recentAppointmentIds }
    }).populate('createdBy', 'name username');

    // Get current SOAP note if exists
    let currentSOAPNote = null;
    if (appointmentId) {
      currentSOAPNote = await SOAPNote.findOne({
        appointmentId
      }).populate('createdBy', 'name username');
    }

    res.status(200).json({
      status: 'success',
      data: {
        patient,
        currentAppointment,
        currentSOAPNote,
        recentAppointments,
        soapNotes
      }
    });

  } catch (error) {
    console.error('Get encounter data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch encounter data'
    });
  }
});

// Get patient history
router.get('/patient-history/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get patient
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

    // Get appointment history
    const appointments = await Appointment.find({
      patientId,
      clinicId: req.user.clinicId
    })
    .populate('providerId', 'name username')
    .sort({ date: -1, time: -1 }) // Fixed: Use 'date' and 'time' fields
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    // Get SOAP notes for these appointments
    const appointmentIds = appointments.map(apt => apt._id);
    const soapNotes = await SOAPNote.find({
      appointmentId: { $in: appointmentIds }
    })
    .populate('createdBy', 'name username')
    .sort({ createdAt: -1 });

    // Create SOAP notes lookup
    const soapNotesMap = {};
    soapNotes.forEach(note => {
      soapNotesMap[note.appointmentId.toString()] = note;
    });

    // Process history data
    const history = appointments.map(appointment => {
      const soapNote = soapNotesMap[appointment._id.toString()];
      
      return {
        _id: appointment._id,
        appointmentDate: appointment.date, // Fixed: Use 'date' field
        appointmentTime: appointment.time, // Fixed: Use 'time' field
        visitType: appointment.visitType,
        status: appointment.status,
        provider: appointment.providerId ? {
          name: appointment.providerId.name || appointment.providerId.username
        } : null,
        soapNote: soapNote ? {
          _id: soapNote._id,
          subjective: soapNote.subjective,
          objective: soapNote.objective,
          assessment: soapNote.assessment,
          plan: soapNote.plan,
          painScale: soapNote.painScale,
          isSigned: soapNote.isSigned,
          createdAt: soapNote.createdAt,
          createdBy: soapNote.createdBy
        } : null
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        patient: {
          _id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          recordNumber: patient.recordNumber,
          dateOfBirth: patient.dateOfBirth
        },
        history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: appointments.length === parseInt(limit)
        }
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

module.exports = router;
