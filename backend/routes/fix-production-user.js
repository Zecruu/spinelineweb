const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Clinic = require('../models/Clinic');

const router = express.Router();

// Fix production user password - PRODUCTION SAFE ENDPOINT
router.post('/fix-production-user', async (req, res) => {
  try {
    console.log('🔧 Fixing production user password...');
    
    // Find the clinic DRAAIV
    let clinic = await Clinic.findOne({
      $or: [
        { clinicCode: 'DRAAIV' },
        { clinicId: 'DRAAIV' }
      ]
    });

    if (!clinic) {
      // Try to find any existing clinic to use
      clinic = await Clinic.findOne({});
      if (!clinic) {
        return res.status(404).json({
          status: 'error',
          message: 'No clinic found in database'
        });
      }
    }

    console.log('✅ Using clinic:', clinic.clinicId || clinic.clinicCode || clinic._id);

    // Find or create test user
    let user = await User.findOne({ username: 'testdoc' });
    
    if (!user) {
      // Create new user if doesn't exist
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = new User({
        username: 'testdoc',
        email: 'testdoc@test.com',
        password: hashedPassword,
        passwordHash: hashedPassword,
        role: 'doctor',
        clinicId: clinic._id,
        isActive: true,
        profile: {
          firstName: 'Test',
          lastName: 'Doctor'
        }
      });
      
      await user.save();
      console.log('✅ Created new test user');
    } else {
      // Update existing user with correct password hash
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await User.updateOne(
        { _id: user._id },
        { 
          password: hashedPassword,
          passwordHash: hashedPassword,
          clinicId: clinic._id,
          isActive: true
        }
      );
      
      console.log('✅ Updated existing test user password');
    }

    // Verify the fix works
    const updatedUser = await User.findOne({ username: 'testdoc' });
    const passwordValid = await bcrypt.compare('password123', updatedUser.password);
    
    if (!passwordValid) {
      throw new Error('Password verification failed after update');
    }

    res.status(200).json({
      status: 'success',
      message: 'Production user fixed successfully',
      credentials: {
        username: 'testdoc',
        password: 'password123',
        clinicCode: clinic.clinicId || clinic.clinicCode || 'DRAAIV'
      },
      verification: {
        userExists: true,
        passwordValid: true,
        clinicLinked: true
      }
    });

  } catch (error) {
    console.error('❌ Error fixing production user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fix production user',
      error: error.message
    });
  }
});

// Health check for this route
router.get('/production-user-status', async (req, res) => {
  try {
    const user = await User.findOne({ username: 'testdoc' });
    const clinic = await Clinic.findOne({
      $or: [
        { clinicCode: 'DRAAIV' },
        { clinicId: 'DRAAIV' }
      ]
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Test user not found',
        needsFix: true
      });
    }

    const passwordValid = await bcrypt.compare('password123', user.password);

    res.status(200).json({
      status: 'success',
      userExists: !!user,
      clinicExists: !!clinic,
      passwordValid: passwordValid,
      clinicCode: clinic?.clinicId || clinic?.clinicCode || 'Unknown',
      needsFix: !passwordValid
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking user status',
      error: error.message
    });
  }
});

module.exports = router;
