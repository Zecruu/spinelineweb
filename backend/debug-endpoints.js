const express = require('express');
const mongoose = require('mongoose');
const SOAPNote = require('./models/SOAPNote');
const CarePackage = require('./models/CarePackage');
const User = require('./models/User');
const { authenticateToken } = require('./middleware/auth');

const router = express.Router();

// Debug endpoint to test authentication and database connectivity
router.get('/debug/auth-test', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Debug auth test:', {
      user: req.user ? {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        clinicId: req.user.clinicId
      } : 'No user',
      timestamp: new Date().toISOString()
    });

    // Test database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      status: 'success',
      auth: {
        authenticated: !!req.user,
        userId: req.user?._id,
        email: req.user?.email,
        role: req.user?.role,
        clinicId: req.user?.clinicId
      },
      database: {
        status: dbStates[dbStatus] || 'unknown',
        readyState: dbStatus,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug auth test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint to test specific failing endpoints
router.get('/debug/soap-note/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const clinicId = req.user?.clinicId;

    console.log('🔍 Debug SOAP note test:', {
      appointmentId,
      clinicId,
      userExists: !!req.user,
      timestamp: new Date().toISOString()
    });

    // Test the exact query that's failing
    const soapNote = await SOAPNote.findOne({
      appointmentId,
      clinicId
    }).populate('patientId', 'firstName lastName recordNumber')
      .populate('providerId', 'firstName lastName');

    res.json({
      status: 'success',
      found: !!soapNote,
      soapNote: soapNote ? {
        id: soapNote._id,
        appointmentId: soapNote.appointmentId,
        clinicId: soapNote.clinicId,
        status: soapNote.status
      } : null,
      query: { appointmentId, clinicId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug SOAP note test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      query: { appointmentId: req.params.appointmentId, clinicId: req.user?.clinicId }
    });
  }
});

// Debug endpoint to test care packages
router.get('/debug/care-packages/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user?.clinicId;

    console.log('🔍 Debug care packages test:', {
      patientId,
      clinicId,
      userExists: !!req.user,
      timestamp: new Date().toISOString()
    });

    // Test the exact query that's failing
    const carePackages = await CarePackage.find({
      patientId,
      clinicId,
      status: 'active'
    });

    res.json({
      status: 'success',
      count: carePackages.length,
      carePackages: carePackages.map(cp => ({
        id: cp._id,
        patientId: cp.patientId,
        clinicId: cp.clinicId,
        status: cp.status
      })),
      query: { patientId, clinicId, status: 'active' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug care packages test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      query: { patientId: req.params.patientId, clinicId: req.user?.clinicId }
    });
  }
});

module.exports = router;
