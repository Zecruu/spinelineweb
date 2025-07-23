const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

const router = express.Router();

// Create test clinic and user for immediate login
router.post('/create-test-account', async (req, res) => {
  try {
    console.log('🧪 Creating test account...');
    
    // Create or find test clinic
    let testClinic = await Clinic.findOne({ clinicCode: 'TEST' });
    
    if (!testClinic) {
      testClinic = new Clinic({
        clinicName: 'Test Clinic',
        name: 'Test Clinic',
        clinicCode: 'TEST',
        clinicId: 'TEST',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testClinic.save();
      console.log('✅ Test clinic created');
    } else {
      console.log('✅ Test clinic already exists');
    }
    
    // Create or update test user
    let testUser = await User.findOne({ username: 'testdoc', clinicId: testClinic._id });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      testUser = new User({
        username: 'testdoc',
        email: 'testdoc@test.com',
        password: hashedPassword,
        role: 'doctor',
        clinicId: testClinic._id,
        isActive: true,
        profile: {
          firstName: 'Test',
          lastName: 'Doctor'
        },
        name: 'Test Doctor'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      // Update password in case it changed
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser.password = hashedPassword;
      testUser.isActive = true;
      await testUser.save();
      console.log('✅ Test user updated');
    }
    
    res.json({
      status: 'success',
      message: 'Test account created successfully',
      credentials: {
        clinicCode: 'TEST',
        username: 'testdoc',
        password: 'password123'
      },
      clinic: {
        id: testClinic._id,
        name: testClinic.clinicName,
        code: testClinic.clinicCode
      },
      user: {
        id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        isActive: testUser.isActive
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating test account:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug endpoint to list all users and clinics
router.get('/debug/users-and-clinics', async (req, res) => {
  try {
    const users = await User.find({}).select('username email clinicId role isActive').limit(20);
    const clinics = await Clinic.find({}).select('clinicName clinicCode clinicId').limit(10);

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        clinicId: user.clinicId,
        role: user.role,
        isActive: user.isActive
      })),
      clinics: clinics.map(clinic => ({
        id: clinic._id,
        name: clinic.clinicName,
        code: clinic.clinicCode,
        clinicId: clinic.clinicId
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching debug data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debug data',
      error: error.message
    });
  }
});

// Fix user clinic association
router.post('/fix-user-clinic', async (req, res) => {
  try {
    const { userEmail, clinicCode } = req.body;

    if (!userEmail || !clinicCode) {
      return res.status(400).json({
        success: false,
        message: 'userEmail and clinicCode are required'
      });
    }

    // Find the clinic
    const clinic = await Clinic.findOne({
      $or: [
        { clinicCode: clinicCode.toUpperCase() },
        { clinicId: clinicCode.toUpperCase() }
      ]
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: `Clinic with code ${clinicCode} not found`
      });
    }

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { clinicId: clinic._id },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with email ${userEmail} not found`
      });
    }

    res.json({
      success: true,
      message: 'User clinic association fixed',
      user: {
        id: user._id,
        email: user.email,
        clinicId: user.clinicId,
        role: user.role
      },
      clinic: {
        id: clinic._id,
        name: clinic.clinicName,
        code: clinic.clinicCode || clinic.clinicId
      }
    });

  } catch (error) {
    console.error('❌ Error fixing user clinic association:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix user clinic association',
      error: error.message
    });
  }
});

module.exports = router;
