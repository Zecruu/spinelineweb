const express = require('express');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

const router = express.Router();

// Debug endpoint to check what's in the database
router.get('/debug/auth-data', async (req, res) => {
  try {
    console.log('🔍 Auth debug endpoint called');
    
    // Get all clinics
    const clinics = await Clinic.find({}).limit(10);
    console.log('🏥 Found clinics:', clinics.length);
    
    // Get all users
    const users = await User.find({}).limit(10);
    console.log('👥 Found users:', users.length);
    
    // Sample data (without sensitive info)
    const clinicSample = clinics.map(c => ({
      _id: c._id,
      name: c.clinicName || c.name,
      code: c.clinicCode || c.clinicId,
      hasCode: !!(c.clinicCode || c.clinicId)
    }));
    
    const userSample = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      clinicId: u.clinicId,
      isActive: u.isActive,
      hasPassword: !!u.password
    }));
    
    res.json({
      status: 'success',
      data: {
        clinics: {
          count: clinics.length,
          sample: clinicSample
        },
        users: {
          count: users.length,
          sample: userSample
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Auth debug error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test clinic lookup
router.post('/debug/test-clinic', async (req, res) => {
  try {
    const { clinicCode } = req.body;
    console.log('🏥 Testing clinic lookup for:', clinicCode);
    
    const clinic = await Clinic.findOne({
      $or: [
        { clinicCode: clinicCode.toUpperCase() },
        { clinicId: clinicCode.toUpperCase() }
      ]
    });
    
    res.json({
      status: 'success',
      found: !!clinic,
      clinic: clinic ? {
        _id: clinic._id,
        name: clinic.clinicName || clinic.name,
        code: clinic.clinicCode || clinic.clinicId
      } : null
    });
    
  } catch (error) {
    console.error('❌ Clinic test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
