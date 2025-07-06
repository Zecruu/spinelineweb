const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).populate('clinicId');
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

// Admin-only middleware
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the token
    await authenticateToken(req, res, () => {});
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Authorization error'
    });
  }
};

// Admin login with hardcoded credentials
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check against environment variables
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin credentials'
      });
    }

    // Create admin token payload
    const tokenPayload = {
      userId: 'admin',
      email: email,
      role: 'admin',
      isAdmin: true
    };

    const token = generateToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        email: email,
        role: 'admin',
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
};

// Special admin authentication middleware (for hardcoded admin)
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's the hardcoded admin
    if (decoded.userId === 'admin' && decoded.isAdmin === true) {
      req.user = {
        id: 'admin',
        email: decoded.email,
        role: 'admin',
        isAdmin: true
      };
      req.token = token;
      return next();
    }

    // If not hardcoded admin, check database user
    const user = await User.findById(decoded.userId).populate('clinicId');
    if (!user || !user.isActive || user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  adminLogin,
  authenticateAdmin
};
