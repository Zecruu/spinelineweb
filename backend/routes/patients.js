const express = require('express');
const Patient = require('../models/Patient');
const { authenticateToken, clinicScopedMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and clinic scoping to all routes
router.use(authenticateToken);
router.use(clinicScopedMiddleware);


// Get all patients for the user's clinic
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status = 'active', searchField } = req.query;

    // If this is a search request with searchField, handle it as a search
    if (search && searchField) {
      console.log('=== PATIENT SEARCH REQUEST ===');
      console.log('Search request received:', req.query);
      console.log('User clinic ID:', req.clinicId);

      if (search.trim().length < 2) {
        console.log('Search term too short or empty');
        return res.json({
          status: 'success',
          data: { patients: [] }
        });
      }

      // Build search query based on field filter
      let searchQuery = { clinicId: req.clinicId };
      const searchTerm = search.trim();

      if (searchField === 'all') {
        const searchRegex = new RegExp(searchTerm, 'i');
        searchQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { recordNumber: searchRegex }
        ];
      } else {
        // Search specific field
        const searchRegex = new RegExp(searchTerm, 'i');
        switch (searchField) {
          case 'recordNumber':
            searchQuery.recordNumber = searchRegex;
            break;
          case 'firstName':
            searchQuery.firstName = searchRegex;
            break;
          case 'lastName':
            searchQuery.lastName = searchRegex;
            break;
          default:
            searchQuery.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex }
            ];
        }
      }

      // Only return active patients for search
      searchQuery.status = { $ne: 'deleted' };

      console.log('Final search query:', JSON.stringify(searchQuery, null, 2));

      const patients = await Patient.find(searchQuery)
        .select('firstName lastName dob recordNumber email phone')
        .sort({ firstName: 1, lastName: 1 })
        .limit(parseInt(limit))
        .lean();

      console.log('Found patients:', patients.length);
      console.log('Patients:', patients);

      return res.json({
        status: 'success',
        data: { patients }
      });
    }
    const skip = (page - 1) * limit;

    // Build query
    const query = { clinicId: req.clinicId };
    
    // Status filter
    if (status === 'active') {
      query.status = { $ne: 'deleted' };
    } else if (status === 'deleted') {
      query.status = 'deleted';
    } else if (status !== 'all') {
      query.status = status;
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { recordNumber: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Execute query with pagination
    const patients = await Patient.find(query)
      .select('firstName lastName dob gender phone email recordNumber status lastVisit totalVisits activeAlertsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    // Add computed fields
    const patientsWithAge = patients.map(patient => ({
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      age: patient.dob ? Math.floor((Date.now() - patient.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));

    res.status(200).json({
      status: 'success',
      data: {
        patients: patientsWithAge,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patients'
    });
  }
});

// Get single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    }).populate('createdBy lastModifiedBy', 'username email');

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { patient }
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient'
    });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      clinicId: req.clinicId,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    // Check for duplicate email or phone in the same clinic
    if (patientData.email) {
      const existingEmail = await Patient.findOne({
        clinicId: req.clinicId,
        email: patientData.email,
        status: { $ne: 'deleted' }
      });
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'A patient with this email already exists'
        });
      }
    }

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      status: 'success',
      message: 'Patient created successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('Create patient error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient record number already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create patient'
    });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Check for duplicate email (excluding current patient)
    if (req.body.email && req.body.email !== patient.email) {
      const existingEmail = await Patient.findOne({
        clinicId: req.clinicId,
        email: req.body.email,
        status: { $ne: 'deleted' },
        _id: { $ne: patient._id }
      });
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'A patient with this email already exists'
        });
      }
    }

    // Update fields
    Object.assign(patient, req.body);
    patient.lastModifiedBy = req.user._id;
    
    await patient.save();

    res.status(200).json({
      status: 'success',
      message: 'Patient updated successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('Update patient error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update patient'
    });
  }
});

// Soft delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    await patient.softDelete(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete patient'
    });
  }
});

// Restore deleted patient
router.post('/:id/restore', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId,
      status: 'deleted'
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Deleted patient not found'
      });
    }

    await patient.restore();

    res.status(200).json({
      status: 'success',
      message: 'Patient restored successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('Restore patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to restore patient'
    });
  }
});

// Add alert to patient
router.post('/:id/alerts', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const alert = {
      ...req.body,
      createdBy: req.user._id,
      createdAt: new Date()
    };

    patient.alerts.push(alert);
    patient.lastModifiedBy = req.user._id;
    await patient.save();

    res.status(201).json({
      status: 'success',
      message: 'Alert added successfully',
      data: { alert: patient.alerts[patient.alerts.length - 1] }
    });

  } catch (error) {
    console.error('Add alert error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add alert'
    });
  }
});

// Update alert
router.put('/:id/alerts/:alertId', async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const alert = patient.alerts.id(req.params.alertId);
    if (!alert) {
      return res.status(404).json({
        status: 'error',
        message: 'Alert not found'
      });
    }

    Object.assign(alert, req.body);
    patient.lastModifiedBy = req.user._id;
    await patient.save();

    res.status(200).json({
      status: 'success',
      message: 'Alert updated successfully',
      data: { alert }
    });

  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update alert'
    });
  }
});

module.exports = router;
