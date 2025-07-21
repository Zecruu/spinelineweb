const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Clinic reference - standardized to ObjectId
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  // Support both old and new user structures
  name: {
    type: String,
    trim: true
  },
  username: {
    type: String,
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
  // Support both password field names
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  passwordHash: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'secretary'],
    required: [true, 'User role is required']
  },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
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
  // Support existing user fields from production
  isNpiVerified: {
    type: Boolean,
    default: false
  },
  notificationSettings: {
    emailAlerts: { type: Boolean, default: true },
    newPatientAlerts: { type: Boolean, default: true },
    flaggedPatientAlerts: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false }
  },
  autoSign: {
    type: Boolean,
    default: false
  },
  defaultPreferences: {
    defaultDuration: { type: Number, default: 15 },
    defaultVisitType: { type: String, default: 'Follow-Up' },
    defaultTemplate: { type: String, default: '' },
    autoSaveNotes: { type: Boolean, default: true }
  },
  lastLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Compound index for clinic-scoped queries
userSchema.index({ clinicId: 1, email: 1 }, { unique: true, sparse: true });
userSchema.index({ clinicId: 1, username: 1 }, { unique: true, sparse: true });
userSchema.index({ clinicId: 1, role: 1 });
userSchema.index({ clinicId: 1, isActive: 1 });
userSchema.index({ email: 1 }); // For global email lookups

// Virtual to get display name
userSchema.virtual('displayName').get(function() {
  if (this.name) return this.name;
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username || this.email;
});

// Virtual to get the password field (either password or passwordHash)
userSchema.virtual('hashedPassword').get(function() {
  return this.password || this.passwordHash;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Handle both password and passwordHash fields
  const passwordField = this.password || this.passwordHash;
  if (!this.isModified('password') && !this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(passwordField, salt);

    // Set both fields for compatibility
    this.password = hashedPassword;
    this.passwordHash = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  const hashedPassword = this.password || this.passwordHash;
  return await bcrypt.compare(candidatePassword, hashedPassword);
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
