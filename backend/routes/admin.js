const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const { authenticateAdmin } = require('../middleware/auth');

// Admin login route (public)
const { adminLogin } = require('../middleware/auth');
router.post('/login', adminLogin);

// Protect all other admin routes
router.use(authenticateAdmin);

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const clinicsCount = await Clinic.countDocuments();
    const usersCount = await User.countDocuments();
    const activeClinics = await Clinic.countDocuments({ isActive: true });

    // Get recent clinics with both schema support
    const recentClinics = await Clinic.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name clinicName clinicCode clinicId createdAt isActive contactInfo contact');

    // Transform clinic data to unified format
    const transformedClinics = recentClinics.map(clinic => ({
      _id: clinic._id,
      name: clinic.clinicName || clinic.name || 'Unnamed Clinic',
      clinicCode: clinic.clinicId || clinic.clinicCode || 'N/A',
      isActive: clinic.isActive,
      createdAt: clinic.createdAt,
      email: clinic.contactInfo?.email || clinic.contact?.email || ''
    }));

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalClinics: clinicsCount,
          totalUsers: usersCount,
          activeClinics: activeClinics
        },
        recentClinics: transformedClinics
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Create new clinic
router.post('/clinics', async (req, res) => {
  try {
    const {
      name,
      clinicCode,
      address,
      contact,
      settings
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Clinic name is required'
      });
    }

    // Check if clinic code already exists (if provided)
    if (clinicCode) {
      const existingClinic = await Clinic.findOne({
        $or: [
          { clinicCode: clinicCode.toUpperCase() },
          { clinicId: clinicCode.toUpperCase() }
        ]
      });
      if (existingClinic) {
        return res.status(400).json({
          status: 'error',
          message: 'Clinic code already exists'
        });
      }
    }

    // Create clinic data with both schema support
    const clinicData = {
      name: name.trim(),
      clinicName: name.trim(), // Support old schema
      address: address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      contact: contact || {
        phone: '',
        email: '',
        website: ''
      },
      contactInfo: { // Support old schema
        email: contact?.email || '',
        phone: contact?.phone || '',
        address: address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        }
      },
      settings: settings || {}
    };

    // Add clinic code if provided (support both fields)
    if (clinicCode) {
      clinicData.clinicCode = clinicCode.toUpperCase();
      clinicData.clinicId = clinicCode.toUpperCase();
    }

    const clinic = new Clinic(clinicData);
    await clinic.save();

    res.status(201).json({
      status: 'success',
      message: 'Clinic created successfully',
      data: {
        clinic: {
          id: clinic._id,
          name: clinic.name,
          clinicCode: clinic.clinicCode,
          createdAt: clinic.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Clinic code already exists'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create clinic'
    });
  }
});

// Get all clinics
router.get('/clinics', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const clinics = await Clinic.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name clinicName clinicCode clinicId contact contactInfo isActive createdAt');

    const total = await Clinic.countDocuments();

    // Transform clinic data to unified format
    const transformedClinics = clinics.map(clinic => ({
      _id: clinic._id,
      name: clinic.clinicName || clinic.name || 'Unnamed Clinic',
      clinicCode: clinic.clinicId || clinic.clinicCode || 'N/A',
      contact: {
        email: clinic.contactInfo?.email || clinic.contact?.email || ''
      },
      isActive: clinic.isActive,
      createdAt: clinic.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        clinics: transformedClinics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinics'
    });
  }
});

// Create user for a clinic
router.post('/users', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      clinicCode,
      profile
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role || !clinicCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, password, role, and clinic code are required'
      });
    }

    // Validate role
    if (!['doctor', 'secretary'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be either doctor or secretary'
      });
    }

    // Find clinic by clinic code or clinicId
    const clinic = await Clinic.findOne({
      $or: [
        { clinicCode: clinicCode.toUpperCase() },
        { clinicId: clinicCode.toUpperCase() }
      ]
    });
    if (!clinic) {
      return res.status(404).json({
        status: 'error',
        message: 'Clinic not found'
      });
    }

    // Check if user already exists in this clinic (support both clinicId formats)
    const existingUser = await User.findOne({
      $or: [
        { clinicId: clinic._id, email },
        { clinicId: clinic.clinicId || clinic.clinicCode, email },
        { clinicId: clinic._id, username },
        { clinicId: clinic.clinicId || clinic.clinicCode, username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists in this clinic'
      });
    }

    // Create user with both schema support
    const userData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      clinicId: clinic.clinicId || clinic._id, // Use string clinicId if available
      name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
      profile: profile || {
        firstName: '',
        lastName: ''
      },
      // Set default notification settings and preferences for compatibility
      notificationSettings: {
        emailAlerts: true,
        newPatientAlerts: true,
        flaggedPatientAlerts: true,
        appointmentReminders: true,
        systemUpdates: false
      },
      autoSign: false,
      defaultPreferences: {
        defaultDuration: 15,
        defaultVisitType: 'Follow-Up',
        defaultTemplate: '',
        autoSaveNotes: true
      }
    };

    const user = new User(userData);
    await user.save();

    // Return user data without password
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      clinicCode: clinic.clinicCode,
      clinicName: clinic.name,
      profile: user.profile,
      createdAt: user.createdAt
    };

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

// Get users for a clinic
router.get('/clinics/:clinicCode/users', async (req, res) => {
  try {
    const { clinicCode } = req.params;

    // Find clinic by either clinicCode or clinicId
    const clinic = await Clinic.findOne({
      $or: [
        { clinicCode: clinicCode.toUpperCase() },
        { clinicId: clinicCode.toUpperCase() }
      ]
    });

    if (!clinic) {
      return res.status(404).json({
        status: 'error',
        message: 'Clinic not found'
      });
    }

    // Get users for this clinic - search by both ObjectId and string clinicId
    const users = await User.find({
      $or: [
        { clinicId: clinic._id },
        { clinicId: clinic.clinicId || clinic.clinicCode }
      ]
    })
      .select('-password -passwordHash')
      .sort({ createdAt: -1 });

    // Transform user data to unified format
    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      permissions: user.permissions,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      data: {
        clinic: {
          id: clinic._id,
          name: clinic.clinicName || clinic.name,
          clinicCode: clinic.clinicId || clinic.clinicCode
        },
        users: transformedUsers
      }
    });
  } catch (error) {
    console.error('Get clinic users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinic users'
    });
  }
});

module.exports = router;
