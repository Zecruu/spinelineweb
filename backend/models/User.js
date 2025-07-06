const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'secretary'],
    required: [true, 'User role is required']
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    licenseNumber: String, // For doctors
    specialization: String, // For doctors
    department: String
  },
  permissions: {
    canViewPatients: { type: Boolean, default: true },
    canEditPatients: { type: Boolean, default: false },
    canDeletePatients: { type: Boolean, default: false },
    canViewBilling: { type: Boolean, default: false },
    canEditBilling: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageClinic: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Compound index for clinic-scoped queries
userSchema.index({ clinicId: 1, email: 1 }, { unique: true });
userSchema.index({ clinicId: 1, username: 1 }, { unique: true });
userSchema.index({ clinicId: 1, role: 1 });
userSchema.index({ clinicId: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          canViewPatients: true,
          canEditPatients: true,
          canDeletePatients: true,
          canViewBilling: true,
          canEditBilling: true,
          canViewReports: true,
          canManageUsers: true,
          canManageClinic: true
        };
        break;
      case 'doctor':
        this.permissions = {
          canViewPatients: true,
          canEditPatients: true,
          canDeletePatients: false,
          canViewBilling: true,
          canEditBilling: false,
          canViewReports: true,
          canManageUsers: false,
          canManageClinic: false
        };
        break;
      case 'secretary':
        this.permissions = {
          canViewPatients: true,
          canEditPatients: true,
          canDeletePatients: false,
          canViewBilling: true,
          canEditBilling: true,
          canViewReports: false,
          canManageUsers: false,
          canManageClinic: false
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
