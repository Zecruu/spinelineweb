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
    
    // For regular users, find user and attach to request
    if (decoded.userId !== 'admin') {
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or inactive user'
        });
      }
      
      // Check clinicId during migration period - warn but don't block
      if (!user.clinicId) {
        console.warn('⚠️ User missing clinicId (migration period):', {
          userId: user._id,
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString()
        });
        // During migration, allow authentication but endpoints may fail gracefully
      } else {
        // Validate clinicId is proper ObjectId format if present
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(user.clinicId)) {
          console.warn('⚠️ User has invalid clinicId format (migration period):', {
            userId: user._id,
            email: user.email,
            clinicId: user.clinicId,
            clinicIdType: typeof user.clinicId,
            timestamp: new Date().toISOString()
          });
          // During migration, set clinicId to null to avoid query errors
          user.clinicId = null;
        }
      }
      
      console.log('✅ User authenticated:', {
        userId: user._id,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        timestamp: new Date().toISOString()
      });
      
      req.user = user;
    } else {
      // For admin users, use decoded data
      req.user = {
        _id: 'admin',
        role: 'admin',
        isAdmin: true,
        email: decoded.email
      };
    }

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

// Role-based middleware factory
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // First authenticate the token
      await authenticateToken(req, res, () => {});

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
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
};

// Clinic-scoped middleware (ensures user can only access their clinic's data)
const clinicScopedMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Skip clinic scoping for admin users
    if (req.user.role === 'admin' || req.user.isAdmin) {
      return next();
    }

    // Attach clinic info to request for easy access
    req.clinicId = req.user.clinicId;

    if (!req.clinicId) {
      return res.status(403).json({
        status: 'error',
        message: 'User not associated with a clinic'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  adminLogin,
  authenticateAdmin,
  requireRole,
  clinicScopedMiddleware
};
