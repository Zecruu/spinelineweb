const express = require('express');
const router = express.Router();
const BillingCode = require('../models/BillingCode');
const { authenticateToken } = require('../middleware/auth');

// Master list of CPT billing codes
const masterBillingCodes = [
  // Chiropractic Manipulative Treatment
  { code: '98940', description: 'Chiropractic manipulative treatment; spinal, 1-2 regions', price: 85 },
  { code: '98941', description: 'Chiropractic manipulative treatment; spinal, 3-4 regions', price: 105 },
  { code: '98942', description: 'Chiropractic manipulative treatment; spinal, 5 regions', price: 125 },
  { code: '98943', description: 'Chiropractic manipulative treatment; extraspinal, 1 or more regions', price: 75 },

  // Physical Medicine and Rehabilitation
  { code: '97110', description: 'Therapeutic procedure, 1 or more areas, each 15 minutes; therapeutic exercises', price: 45 },
  { code: '97112', description: 'Therapeutic procedure, 1 or more areas, each 15 minutes; neuromuscular reeducation', price: 50 },
  { code: '97116', description: 'Therapeutic procedure, 1 or more areas, each 15 minutes; gait training', price: 55 },
  { code: '97124', description: 'Therapeutic procedure, 1 or more areas, each 15 minutes; massage', price: 40 },
  { code: '97140', description: 'Manual therapy techniques (eg, mobilization/manipulation, manual lymphatic drainage, manual traction), 1 or more regions, each 15 minutes', price: 60 },
  { code: '97150', description: 'Therapeutic procedure(s), group (2 or more individuals)', price: 35 },

  // Modalities
  { code: '97010', description: 'Application of a modality to 1 or more areas; hot or cold packs', price: 25 },
  { code: '97012', description: 'Application of a modality to 1 or more areas; traction, mechanical', price: 30 },
  { code: '97014', description: 'Application of a modality to 1 or more areas; electrical stimulation (unattended)', price: 25 },
  { code: '97016', description: 'Application of a modality to 1 or more areas; vasopneumatic devices', price: 30 },
  { code: '97018', description: 'Application of a modality to 1 or more areas; paraffin bath', price: 20 },
  { code: '97022', description: 'Application of a modality to 1 or more areas; whirlpool', price: 35 },
  { code: '97024', description: 'Application of a modality to 1 or more areas; diathermy (eg, microwave)', price: 30 },
  { code: '97026', description: 'Application of a modality to 1 or more areas; infrared', price: 25 },
  { code: '97028', description: 'Application of a modality to 1 or more areas; ultraviolet', price: 25 },
  { code: '97032', description: 'Application of a modality to 1 or more areas; electrical stimulation (manual), each 15 minutes', price: 40 },
  { code: '97033', description: 'Application of a modality to 1 or more areas; iontophoresis, each 15 minutes', price: 45 },
  { code: '97034', description: 'Application of a modality to 1 or more areas; contrast baths, each 15 minutes', price: 30 },
  { code: '97035', description: 'Application of a modality to 1 or more areas; ultrasound, each 15 minutes', price: 35 },
  { code: '97036', description: 'Application of a modality to 1 or more areas; Hubbard tank, each 15 minutes', price: 50 },

  // Evaluation and Management
  { code: '99201', description: 'Office or other outpatient visit for the evaluation and management of a new patient', price: 150 },
  { code: '99202', description: 'Office or other outpatient visit for the evaluation and management of a new patient', price: 180 },
  { code: '99203', description: 'Office or other outpatient visit for the evaluation and management of a new patient', price: 220 },
  { code: '99204', description: 'Office or other outpatient visit for the evaluation and management of a new patient', price: 280 },
  { code: '99205', description: 'Office or other outpatient visit for the evaluation and management of a new patient', price: 350 },
  { code: '99211', description: 'Office or other outpatient visit for the evaluation and management of an established patient', price: 75 },
  { code: '99212', description: 'Office or other outpatient visit for the evaluation and management of an established patient', price: 110 },
  { code: '99213', description: 'Office or other outpatient visit for the evaluation and management of an established patient', price: 150 },
  { code: '99214', description: 'Office or other outpatient visit for the evaluation and management of an established patient', price: 200 },
  { code: '99215', description: 'Office or other outpatient visit for the evaluation and management of an established patient', price: 280 },

  // Acupuncture
  { code: '97810', description: 'Acupuncture, 1 or more needles; without electrical stimulation, initial 15 minutes', price: 80 },
  { code: '97811', description: 'Acupuncture, 1 or more needles; without electrical stimulation, each additional 15 minutes', price: 40 },
  { code: '97813', description: 'Acupuncture, 1 or more needles; with electrical stimulation, initial 15 minutes', price: 90 },
  { code: '97814', description: 'Acupuncture, 1 or more needles; with electrical stimulation, each additional 15 minutes', price: 45 },

  // X-ray and Imaging
  { code: '72020', description: 'Radiologic examination, spine, single view, specify level', price: 120 },
  { code: '72040', description: 'Radiologic examination, spine, cervical; 2 or 3 views', price: 150 },
  { code: '72050', description: 'Radiologic examination, spine, cervical; 4 or 5 views', price: 180 },
  { code: '72070', description: 'Radiologic examination, spine; thoracic, 2 views', price: 140 },
  { code: '72080', description: 'Radiologic examination, spine; thoracic, minimum of 4 views', price: 170 },
  { code: '72100', description: 'Radiologic examination, spine, lumbosacral; 2 or 3 views', price: 150 },
  { code: '72110', description: 'Radiologic examination, spine, lumbosacral; minimum of 4 views', price: 180 }
];

// Get master list of billing codes for search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;

    let filteredCodes = masterBillingCodes;

    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCodes = masterBillingCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm) ||
        code.description.toLowerCase().includes(searchTerm)
      );
    }

    res.status(200).json(filteredCodes);
  } catch (error) {
    console.error('Get master billing codes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch billing codes'
    });
  }
});

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
