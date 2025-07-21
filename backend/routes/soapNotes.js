const express = require('express');
const router = express.Router();
const SOAPNote = require('../models/SOAPNote');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { authenticateToken } = require('../middleware/auth');

// Get SOAP note by appointment ID
router.get('/appointment/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const clinicId = req.user.clinicId;

    // Validate input
    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: 'Invalid appointment ID format' });
    }

    if (!clinicId) {
      return res.status(403).json({ message: 'User not associated with a clinic' });
    }

    console.log('🔍 SOAP note request:', { appointmentId, clinicId, timestamp: new Date().toISOString() });

    const soapNote = await SOAPNote.findOne({
      appointmentId,
      clinicId
    }).populate('patientId', 'firstName lastName recordNumber')
      .populate('providerId', 'firstName lastName');

    console.log('📝 Found SOAP note:', soapNote ? 'Yes' : 'No');

    if (!soapNote) {
      return res.status(404).json({ message: 'SOAP note not found' });
    }

    res.json(soapNote);
  } catch (error) {
    console.error('❌ Error fetching SOAP note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update SOAP note (autosave)
router.post('/autosave', authenticateToken, async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      soapData,
      spineSegments = {},
      diagnosticCodes = [],
      billingCodes = [],
      status = 'in-progress'
    } = req.body;
    const clinicId = req.user.clinicId;
    const providerId = req.user.id;

    // Input validation
    if (!appointmentId || !patientId) {
      return res.status(400).json({ 
        message: 'Missing required fields: appointmentId and patientId are required' 
      });
    }

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(appointmentId) || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ 
        message: 'Invalid appointmentId or patientId format' 
      });
    }

    console.log('💾 SOAP autosave request:', {
      appointmentId,
      patientId,
      clinicId,
      providerId,
      hasSOAPData: !!soapData,
      timestamp: new Date().toISOString()
    });

    // Validate appointment exists
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      clinicId
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Find existing SOAP note or create new one
    let soapNote = await SOAPNote.findOne({
      appointmentId,
      clinicId
    });

    if (soapNote) {
      // Update existing note
      if (soapNote.isSigned) {
        return res.status(400).json({ message: 'Cannot modify signed SOAP note' });
      }

      // Update SOAP content based on existing schema
      if (soapData.subjective) {
        if (!soapNote.subjective) soapNote.subjective = {};
        soapNote.subjective.historyOfPresentIllness = soapData.subjective;
      }
      if (soapData.objective) {
        if (!soapNote.objective) soapNote.objective = {};
        soapNote.objective.physicalExam = soapData.objective;
      }
      if (soapData.assessment) {
        if (!soapNote.assessment) soapNote.assessment = {};
        soapNote.assessment.clinicalImpression = soapData.assessment;
      }
      if (soapData.plan) {
        if (!soapNote.plan) soapNote.plan = {};
        soapNote.plan.treatmentPlan = soapData.plan;
      }

      soapNote.status = status;
      soapNote.spineSegments = spineSegments;
      soapNote.diagnosticCodes = diagnosticCodes;
      soapNote.billingCodes = billingCodes;
      soapNote.lastModifiedBy = providerId;
      
    } else {
      // Create new SOAP note
      soapNote = new SOAPNote({
        appointmentId,
        patientId,
        clinicId,
        providerId,
        subjective: {
          historyOfPresentIllness: soapData.subjective || ''
        },
        objective: {
          physicalExam: soapData.objective || ''
        },
        assessment: {
          clinicalImpression: soapData.assessment || ''
        },
        plan: {
          treatmentPlan: soapData.plan || ''
        },
        spineSegments,
        diagnosticCodes,
        billingCodes,
        status,
        createdBy: providerId
      });
    }

    // Save SOAP note with error handling
    const savedSOAPNote = await soapNote.save();
    console.log('✅ SOAP note saved successfully:', savedSOAPNote._id);

    // Update appointment status to indicate SOAP note in progress
    // Use safer update method with validation
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, clinicId }, // Ensure clinic ownership
      {
        hasSOAPNote: true,
        soapNoteStatus: status,
        lastModified: new Date()
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedAppointment) {
      console.warn('⚠️ Failed to update appointment status - appointment not found or access denied');
    } else {
      console.log('✅ Appointment status updated:', updatedAppointment._id);
    }

    res.json({
      message: 'SOAP note saved successfully',
      soapNote: {
        _id: soapNote._id,
        status: soapNote.status,
        lastModified: soapNote.lastModified
      }
    });

  } catch (error) {
    console.error('❌ Error saving SOAP note:', {
      error: error.message,
      stack: error.stack,
      appointmentId: req.body.appointmentId,
      patientId: req.body.patientId,
      timestamp: new Date().toISOString()
    });
    
    // Return specific error information to help with debugging
    res.status(500).json({ 
      message: 'Failed to save SOAP note',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get patient history for SOAP note interface
router.get('/patient-history/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user?.clinicId;
    const limit = parseInt(req.query.limit) || 10;

    // Validate input
    if (!patientId) {
      return res.status(400).json({
        message: 'Patient ID is required'
      });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        message: 'Invalid patient ID format'
      });
    }

    console.log('🔍 Patient history request:', {
      patientId,
      clinicId,
      limit,
      user: req.user ? 'exists' : 'missing',
      userKeys: req.user ? Object.keys(req.user) : 'none',
      timestamp: new Date().toISOString()
    });

    if (!clinicId) {
      console.log('❌ No clinicId found in user object');
      return res.status(403).json({
        message: 'User not associated with a clinic. Please contact administrator.'
      });
    }

    const history = await SOAPNote.find({
      patientId,
      clinicId,
      isSigned: true
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('providerId', 'firstName lastName')
    .select('createdAt subjective objective assessment plan status');

    console.log('📋 Found history records:', history.length);

    const formattedHistory = history.map(note => ({
      date: note.createdAt.toLocaleDateString(),
      provider: note.providerId ? `${note.providerId.firstName} ${note.providerId.lastName}` : 'Unknown Provider',
      summary: note.subjective?.chiefComplaint || note.subjective?.historyOfPresentIllness || 'No summary available',
      assessment: note.assessment?.clinicalImpression || '',
      plan: note.plan?.treatmentPlan || ''
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('❌ Error fetching patient history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete and sign SOAP note
router.post('/sign/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      signatureData,
      soapData,
      spineSegments = {},
      diagnosticCodes = [],
      billingCodes = []
    } = req.body;
    const clinicId = req.user.clinicId;
    const providerId = req.user.id;

    const soapNote = await SOAPNote.findOne({
      appointmentId,
      clinicId
    });

    if (!soapNote) {
      return res.status(404).json({ message: 'SOAP note not found' });
    }

    if (soapNote.isSigned) {
      return res.status(400).json({ message: 'SOAP note is already signed' });
    }

    // Update final SOAP content
    if (soapData.subjective) {
      if (!soapNote.subjective) soapNote.subjective = {};
      soapNote.subjective.historyOfPresentIllness = soapData.subjective;
    }
    if (soapData.objective) {
      if (!soapNote.objective) soapNote.objective = {};
      soapNote.objective.physicalExam = soapData.objective;
    }
    if (soapData.assessment) {
      if (!soapNote.assessment) soapNote.assessment = {};
      soapNote.assessment.clinicalImpression = soapData.assessment;
    }
    if (soapData.plan) {
      if (!soapNote.plan) soapNote.plan = {};
      soapNote.plan.treatmentPlan = soapData.plan;
    }

    // Update spine segments, diagnostic codes, and billing codes
    soapNote.spineSegments = spineSegments;
    soapNote.diagnosticCodes = diagnosticCodes;
    soapNote.billingCodes = billingCodes;

    // Add signature
    soapNote.digitalSignature = signatureData;
    soapNote.signedAt = new Date();
    soapNote.signedBy = providerId;
    soapNote.isSigned = true;
    soapNote.isComplete = true;
    soapNote.status = 'completed';
    soapNote.lastModifiedBy = providerId;

    await soapNote.save();

    // Update appointment status to checked-out
    await Appointment.findByIdAndUpdate(appointmentId, {
      hasSOAPNote: true,
      soapNoteStatus: 'completed',
      doctorSigned: true,
      status: 'checked-out',
      checkOutTime: new Date().toTimeString().slice(0, 5) // HH:MM format
    });

    res.json({
      message: 'SOAP note signed successfully',
      soapNote: {
        _id: soapNote._id,
        status: soapNote.status,
        isSigned: soapNote.isSigned,
        signedAt: soapNote.signedAt
      }
    });

  } catch (error) {
    console.error('Error signing SOAP note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SOAP note templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = {
      subjective: [
        "Patient reports...",
        "Chief complaint: ",
        "Pain level: /10",
        "Location of pain: ",
        "Onset: ",
        "Duration: ",
        "Quality: ",
        "Aggravating factors: ",
        "Relieving factors: "
      ],
      objective: [
        "Vital signs: ",
        "General appearance: ",
        "Range of motion: ",
        "Palpation findings: ",
        "Orthopedic tests: ",
        "Neurological findings: "
      ],
      assessment: [
        "Primary diagnosis: ",
        "Secondary diagnosis: ",
        "Clinical impression: ",
        "Prognosis: "
      ],
      plan: [
        "Treatment plan: ",
        "Frequency: ",
        "Duration: ",
        "Home exercises: ",
        "Follow-up: ",
        "Patient education: "
      ]
    };

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
