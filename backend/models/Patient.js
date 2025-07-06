const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Clinic association
  clinicId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },

  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  // Record Management
  recordNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Insurance Information
  insuranceInfo: [{
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true
    },
    copay: {
      type: Number,
      min: 0,
      default: 0
    },
    coveredCodes: [{
      type: String,
      trim: true
    }],
    maxVisits: {
      type: Number,
      min: 0
    },
    deductible: {
      type: Number,
      min: 0,
      default: 0
    },
    deductibleMet: {
      type: Number,
      min: 0,
      default: 0
    },
    effectiveDate: Date,
    expirationDate: Date,
    isPrimary: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String
  }],

  // Referral Information
  referral: {
    referringDoctor: {
      name: String,
      phone: String,
      email: String,
      npi: String
    },
    referralDate: Date,
    expirationDate: Date,
    visitsAuthorized: {
      type: Number,
      min: 0
    },
    visitsUsed: {
      type: Number,
      min: 0,
      default: 0
    },
    diagnosis: String,
    notes: String,
    isActive: {
      type: Boolean,
      default: true
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderDate: Date
  },

  // Active Packages
  activePackages: [{
    packageName: {
      type: String,
      required: true,
      trim: true
    },
    visitsRemaining: {
      type: Number,
      required: true,
      min: 0
    },
    totalVisits: {
      type: Number,
      required: true,
      min: 1
    },
    linkedCode: {
      type: String,
      trim: true
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    expirationDate: Date,
    price: {
      type: Number,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String
  }],

  // Alerts and Flags
  alerts: [{
    type: {
      type: String,
      enum: ['medical', 'billing', 'insurance', 'referral', 'general'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Status and Tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  lastVisit: Date,
  nextAppointment: Date,
  totalVisits: {
    type: Number,
    default: 0,
    min: 0
  },

  // Additional Information
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  occupation: String,
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', 'other']
  },

  // Medical History
  medicalHistory: {
    allergies: [String],
    medications: [String],
    conditions: [String],
    surgeries: [{
      procedure: String,
      date: Date,
      notes: String
    }],
    familyHistory: String,
    notes: String
  },

  // File Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String
  }],

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

// Indexes for performance
patientSchema.index({ clinicId: 1, recordNumber: 1 }, { unique: true });
patientSchema.index({ clinicId: 1, firstName: 1, lastName: 1 });
patientSchema.index({ clinicId: 1, email: 1 }, { sparse: true });
patientSchema.index({ clinicId: 1, phone: 1 }, { sparse: true });
patientSchema.index({ clinicId: 1, status: 1 });
patientSchema.index({ clinicId: 1, lastVisit: -1 });
patientSchema.index({ 'referral.expirationDate': 1 });
patientSchema.index({ 'alerts.isActive': 1, 'alerts.priority': 1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual('age').get(function() {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for active alerts count
patientSchema.virtual('activeAlertsCount').get(function() {
  return this.alerts.filter(alert => alert.isActive).length;
});

// Pre-save middleware to generate record number
patientSchema.pre('save', async function(next) {
  if (this.isNew && !this.recordNumber) {
    try {
      // Generate record number: CLINIC-YYYYMMDD-XXX
      const clinic = await mongoose.model('Clinic').findOne({
        $or: [
          { _id: this.clinicId },
          { clinicId: this.clinicId },
          { clinicCode: this.clinicId }
        ]
      });
      
      const clinicCode = clinic?.clinicId || clinic?.clinicCode || 'UNK';
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the next sequential number for today
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      
      const todayCount = await this.constructor.countDocuments({
        clinicId: this.clinicId,
        createdAt: { $gte: todayStart, $lt: todayEnd }
      });
      
      const sequentialNumber = String(todayCount + 1).padStart(3, '0');
      this.recordNumber = `${clinicCode}-${dateStr}-${sequentialNumber}`;
    } catch (error) {
      console.error('Error generating record number:', error);
      // Fallback to timestamp-based record number
      this.recordNumber = `${Date.now()}`;
    }
  }
  next();
});

// Method to soft delete
patientSchema.methods.softDelete = function(deletedBy) {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Method to restore from soft delete
patientSchema.methods.restore = function() {
  this.status = 'active';
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Static method to find active patients
patientSchema.statics.findActive = function(clinicId) {
  return this.find({ clinicId, status: { $ne: 'deleted' } });
};

module.exports = mongoose.model('Patient', patientSchema);
