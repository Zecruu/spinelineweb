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

    // Find user by username and clinic - handle ObjectId format
    console.log('🔍 Looking for user:', { username, clinicId: clinic._id });
    
    const user = await User.findOne({
      $or: [
        { clinicId: clinic._id, username },
        { clinicId: clinic._id, email: username }
      ],
      isActive: true
    });
    
    console.log('👤 User found:', user ? 'Yes' : 'No');

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
