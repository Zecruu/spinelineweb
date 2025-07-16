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

    const soapNote = await SOAPNote.findOne({
      appointmentId,
      clinicId
    }).populate('patientId', 'firstName lastName recordNumber')
      .populate('providerId', 'firstName lastName');

    if (!soapNote) {
      return res.status(404).json({ message: 'SOAP note not found' });
    }

    res.json(soapNote);
  } catch (error) {
    console.error('Error fetching SOAP note:', error);
    res.status(500).json({ message: 'Server error' });
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
        soapNote.subjective.historyOfPresentIllness = soapData.subjective;
      }
      if (soapData.objective) {
        soapNote.objective.physicalExam = soapData.objective;
      }
      if (soapData.assessment) {
        soapNote.assessment.clinicalImpression = soapData.assessment;
      }
      if (soapData.plan) {
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

    await soapNote.save();

    // Update appointment status to indicate SOAP note in progress
    await Appointment.findByIdAndUpdate(appointmentId, {
      hasSOAPNote: true,
      soapNoteStatus: status
    });

    res.json({
      message: 'SOAP note saved successfully',
      soapNote: {
        _id: soapNote._id,
        status: soapNote.status,
        lastModified: soapNote.lastModified
      }
    });

  } catch (error) {
    console.error('Error saving SOAP note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient history for SOAP note interface
router.get('/patient-history/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinicId;
    const limit = parseInt(req.query.limit) || 10;

    const history = await SOAPNote.find({
      patientId,
      clinicId,
      isSigned: true
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('providerId', 'firstName lastName')
    .select('createdAt subjective objective assessment plan status');

    const formattedHistory = history.map(note => ({
      date: note.createdAt.toLocaleDateString(),
      provider: `${note.providerId.firstName} ${note.providerId.lastName}`,
      summary: note.subjective?.chiefComplaint || note.subjective?.historyOfPresentIllness || 'No summary available',
      assessment: note.assessment?.clinicalImpression || '',
      plan: note.plan?.treatmentPlan || ''
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ message: 'Server error' });
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
      soapNote.subjective.historyOfPresentIllness = soapData.subjective;
    }
    if (soapData.objective) {
      soapNote.objective.physicalExam = soapData.objective;
    }
    if (soapData.assessment) {
      soapNote.assessment.clinicalImpression = soapData.assessment;
    }
    if (soapData.plan) {
      soapNote.plan.treatmentPlan = soapData.plan;
    }

    // Update spine segments, diagnostic codes, and billing codes
    soapNote.spineSegments = spineSegments;
    soapNote.diagnosticCodes = diagnosticCodes;
    soapNote.billingCodes = billingCodes;

    // Add signature
    soapNote.signature = {
      data: signatureData,
      timestamp: new Date(),
      signedBy: providerId,
      signedByName: `${req.user.firstName} ${req.user.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    soapNote.isSigned = true;
    soapNote.isCompleted = true;
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
        signedAt: soapNote.signature.timestamp
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
