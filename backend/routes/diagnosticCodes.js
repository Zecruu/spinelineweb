const express = require('express');
const router = express.Router();
const DiagnosticCode = require('../models/DiagnosticCode');
const { authenticateToken } = require('../middleware/auth');

// Master list of ICD-10 diagnostic codes
const masterDiagnosticCodes = [
  // Musculoskeletal and connective tissue disorders (M00-M99)
  { code: 'M99.01', description: 'Segmental and somatic dysfunction of cervical region' },
  { code: 'M99.02', description: 'Segmental and somatic dysfunction of thoracic region' },
  { code: 'M99.03', description: 'Segmental and somatic dysfunction of lumbar region' },
  { code: 'M99.04', description: 'Segmental and somatic dysfunction of sacral region' },
  { code: 'M99.05', description: 'Segmental and somatic dysfunction of pelvic region' },
  { code: 'M99.06', description: 'Segmental and somatic dysfunction of lower extremity' },
  { code: 'M99.07', description: 'Segmental and somatic dysfunction of upper extremity' },
  { code: 'M99.08', description: 'Segmental and somatic dysfunction of rib cage' },
  { code: 'M99.09', description: 'Segmental and somatic dysfunction of abdomen and other regions' },
  { code: 'M54.2', description: 'Cervicalgia' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'M54.6', description: 'Pain in thoracic spine' },
  { code: 'M54.9', description: 'Dorsalgia, unspecified' },
  { code: 'M25.50', description: 'Pain in unspecified joint' },
  { code: 'M25.511', description: 'Pain in right shoulder' },
  { code: 'M25.512', description: 'Pain in left shoulder' },
  { code: 'M25.519', description: 'Pain in unspecified shoulder' },
  { code: 'M25.521', description: 'Pain in right elbow' },
  { code: 'M25.522', description: 'Pain in left elbow' },
  { code: 'M25.531', description: 'Pain in right wrist' },
  { code: 'M25.532', description: 'Pain in left wrist' },
  { code: 'M25.551', description: 'Pain in right hip' },
  { code: 'M25.552', description: 'Pain in left hip' },
  { code: 'M25.559', description: 'Pain in unspecified hip' },
  { code: 'M25.561', description: 'Pain in right knee' },
  { code: 'M25.562', description: 'Pain in left knee' },
  { code: 'M25.569', description: 'Pain in unspecified knee' },
  { code: 'M25.571', description: 'Pain in right ankle and joints of right foot' },
  { code: 'M25.572', description: 'Pain in left ankle and joints of left foot' },

  // Spinal disorders
  { code: 'M43.6', description: 'Torticollis' },
  { code: 'M43.8', description: 'Other specified deforming dorsopathies' },
  { code: 'M47.812', description: 'Spondylosis without myelopathy or radiculopathy, cervical region' },
  { code: 'M47.816', description: 'Spondylosis without myelopathy or radiculopathy, lumbar region' },
  { code: 'M48.02', description: 'Spinal stenosis, cervical region' },
  { code: 'M48.06', description: 'Spinal stenosis, lumbar region' },
  { code: 'M50.20', description: 'Other cervical disc displacement, unspecified cervical region' },
  { code: 'M50.30', description: 'Other cervical disc degeneration, unspecified cervical region' },
  { code: 'M51.26', description: 'Other intervertebral disc displacement, lumbar region' },
  { code: 'M51.36', description: 'Other intervertebral disc degeneration, lumbar region' },

  // Muscle and tendon disorders
  { code: 'M62.830', description: 'Muscle spasm of back' },
  { code: 'M62.838', description: 'Other muscle spasm' },
  { code: 'M79.1', description: 'Myalgia' },
  { code: 'M79.2', description: 'Neuralgia and neuritis, unspecified' },
  { code: 'M79.3', description: 'Panniculitis, unspecified' },
  { code: 'M79.601', description: 'Pain in right arm' },
  { code: 'M79.602', description: 'Pain in left arm' },
  { code: 'M79.603', description: 'Pain in arm, unspecified' },
  { code: 'M79.604', description: 'Pain in right leg' },
  { code: 'M79.605', description: 'Pain in left leg' },
  { code: 'M79.606', description: 'Pain in leg, unspecified' },

  // Joint disorders
  { code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site' },
  { code: 'M19.011', description: 'Primary osteoarthritis, right shoulder' },
  { code: 'M19.012', description: 'Primary osteoarthritis, left shoulder' },
  { code: 'M19.071', description: 'Primary osteoarthritis, right ankle and foot' },
  { code: 'M19.072', description: 'Primary osteoarthritis, left ankle and foot' },

  // Headache disorders (G43-G44)
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable, without status migrainosus' },
  { code: 'G44.1', description: 'Vascular headache, not elsewhere classified' },
  { code: 'G44.209', description: 'Tension-type headache, unspecified, not intractable' },
  { code: 'G44.309', description: 'Post-traumatic headache, unspecified, not intractable' },

  // Nerve disorders
  { code: 'G54.0', description: 'Brachial plexus disorders' },
  { code: 'G54.1', description: 'Lumbosacral plexus disorders' },
  { code: 'G54.2', description: 'Cervical root disorders, not elsewhere classified' },
  { code: 'G54.3', description: 'Thoracic root disorders, not elsewhere classified' },
  { code: 'G54.4', description: 'Lumbosacral root disorders, not elsewhere classified' },
  { code: 'G56.00', description: 'Carpal tunnel syndrome, unspecified upper limb' },
  { code: 'G56.01', description: 'Carpal tunnel syndrome, right upper limb' },
  { code: 'G56.02', description: 'Carpal tunnel syndrome, left upper limb' },

  // Injury codes (S00-T88)
  { code: 'S13.4XXA', description: 'Sprain of ligaments of cervical spine, initial encounter' },
  { code: 'S23.3XXA', description: 'Sprain of ligaments of thoracic spine, initial encounter' },
  { code: 'S33.5XXA', description: 'Sprain of ligaments of lumbar spine, initial encounter' },
  { code: 'S43.401A', description: 'Unspecified sprain of right shoulder joint, initial encounter' },
  { code: 'S43.402A', description: 'Unspecified sprain of left shoulder joint, initial encounter' },
  { code: 'S63.501A', description: 'Unspecified sprain of right wrist, initial encounter' },
  { code: 'S63.502A', description: 'Unspecified sprain of left wrist, initial encounter' },
  { code: 'S73.101A', description: 'Unspecified sprain of right hip, initial encounter' },
  { code: 'S73.102A', description: 'Unspecified sprain of left hip, initial encounter' },
  { code: 'S83.501A', description: 'Sprain of unspecified cruciate ligament of right knee, initial encounter' },
  { code: 'S83.502A', description: 'Sprain of unspecified cruciate ligament of left knee, initial encounter' },

  // Other common conditions
  { code: 'R51', description: 'Headache' },
  { code: 'R52', description: 'Pain, unspecified' },
  { code: 'R25.2', description: 'Cramp and spasm' },
  { code: 'R29.3', description: 'Abnormal posture' },
  { code: 'Z51.89', description: 'Other specified aftercare' },
  { code: 'Z98.1', description: 'Arthrodesis status' }
];

// Get master list of diagnostic codes for search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;

    let filteredCodes = masterDiagnosticCodes;

    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCodes = masterDiagnosticCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm) ||
        code.description.toLowerCase().includes(searchTerm)
      );
    }

    res.status(200).json(filteredCodes);
  } catch (error) {
    console.error('Get master diagnostic codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch diagnostic codes'
    });
  }
});

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
