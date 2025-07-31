const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Clinic = require('../models/Clinic');

const router = express.Router();

// User login (doctors and secretaries)
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login attempt:', { username: req.body.username, clinicCode: req.body.clinicCode });
    const { username, password, clinicCode } = req.body;

    // Validate required fields
    if (!username || !password || !clinicCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, password, and clinic code are required'
      });
    }

    // Set timeout for database operations
    const QUERY_TIMEOUT = 5000; // 5 seconds

    // Find clinic by clinic code or clinicId with timeout
    const clinic = await Promise.race([
      Clinic.findOne({
        $or: [
          { clinicCode: clinicCode.toUpperCase() },
          { clinicId: clinicCode.toUpperCase() }
        ]
      }).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Clinic query timeout')), QUERY_TIMEOUT)
      )
    ]);

    if (!clinic) {
      return res.status(404).json({
        status: 'error',
        message: 'Clinic not found'
      });
    }

    console.log('🔍 Looking for user:', { username, clinicId: clinic._id, clinicCode });

    // Find user with timeout and simplified query
    const user = await Promise.race([
      User.findOne({
        $and: [
          {
            $or: [
              { username },
              { email: username }
            ]
          },
          {
            $or: [
              { clinicId: clinic._id },
              { clinicId: clinic._id.toString() },
              { clinicId: clinicCode },
              { clinicId: clinicCode.toUpperCase() }
            ]
          }
        ],
        isActive: true
      }).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User query timeout')), QUERY_TIMEOUT)
      )
    ]);

    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('👤 User details:', {
        id: user._id,
        username: user.username,
        email: user.email,
        clinicId: user.clinicId,
        role: user.role
      });
    } else {
      // Debug: Show what users exist for this clinic
      const allUsersInClinic = await User.find({
        $or: [
          { clinicId: clinic._id },
          { clinicId: clinic._id.toString() },
          { clinicId: clinicCode },
          { clinicId: clinicCode.toUpperCase() }
        ]
      }).select('username email clinicId role isActive');

      console.log('🔍 All users in clinic:', allUsersInClinic);

      // Also check if user exists with different clinic
      const userAnyClinic = await User.findOne({
        $or: [
          { username },
          { email: username }
        ]
      }).select('username email clinicId role isActive');

      console.log('🔍 User in any clinic:', userAnyClinic);
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        clinicId: user.clinicId,
        role: user.role,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        clinicId: user.clinicId,
        clinic: {
          id: clinic._id,
          name: clinic.clinicName || clinic.name,
          code: clinic.clinicId || clinic.clinicCode
        }
      }
    });

  } catch (error) {
    console.error('❌ Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error types
    if (error.message.includes('timeout')) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection timeout. Please try again in a moment.',
        error: 'service_timeout'
      });
    }
    
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection issue. Please try again.',
        error: 'database_error'
      });
    }
    
    // Generic error response
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user info (protected route)
router.get('/me', async (req, res) => {
  try {
    // This route will use auth middleware
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password -passwordHash');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const clinic = await Clinic.findOne({
      $or: [
        { _id: user.clinicId },
        { clinicId: user.clinicId },
        { clinicCode: user.clinicId }
      ]
    });

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        clinicId: user.clinicId,
        clinic: clinic ? {
          id: clinic._id,
          name: clinic.clinicName || clinic.name,
          code: clinic.clinicId || clinic.clinicCode
        } : null
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

module.exports = router;
