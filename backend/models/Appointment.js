const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Clinic and Patient Association
  clinicId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },

  // Appointment Details
  date: {
    type: Date,
    required: [true, 'Appointment date is required'],
    index: true
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [240, 'Maximum appointment duration is 4 hours']
  },

  // Visit Information
  type: {
    type: String,
    enum: ['new', 'regular', 're-eval', 'walk-in', 'follow-up', 'consultation'],
    required: [true, 'Visit type is required'],
    default: 'regular'
  },
  visitType: {
    type: String,
    enum: ['New', 'Regular', 'Re-Eval', 'Walk-In', 'Follow-Up', 'Consultation'],
    required: [true, 'Visit type display name is required'],
    default: 'Regular'
  },

  // Status Management
  status: {
    type: String,
    enum: ['scheduled', 'checked-in', 'in-progress', 'checked-out', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },

  // Timing Tracking
  checkInTime: {
    type: Date,
    index: true
  },
  checkOutTime: {
    type: Date,
    index: true
  },
  actualStartTime: Date,
  actualEndTime: Date,

  // Appointment Details
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  chiefComplaint: {
    type: String,
    trim: true,
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },

  // Provider Information
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  providerName: {
    type: String,
    trim: true
  },

  // Room and Resources
  roomNumber: {
    type: String,
    trim: true
  },
  equipment: [{
    type: String,
    trim: true
  }],

  // Insurance and Billing
  insuranceVerified: {
    type: Boolean,
    default: false
  },
  copayCollected: {
    type: Boolean,
    default: false
  },
  copayAmount: {
    type: Number,
    min: 0,
    default: 0
  },

  // Referral Information
  referralRequired: {
    type: Boolean,
    default: false
  },
  referralVerified: {
    type: Boolean,
    default: false
  },
  referralVisitsRemaining: {
    type: Number,
    min: 0
  },

  // Follow-up and Care Plan
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  carePackageUsed: {
    packageId: {
      type: mongoose.Schema.Types.ObjectId
    },
    packageName: String,
    visitsUsed: {
      type: Number,
      default: 1,
      min: 0
    }
  },

  // Communication
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  confirmationSent: {
    type: Boolean,
    default: false
  },
  confirmationSentAt: Date,

  // Billing and Checkout
  billingCodes: [{
    code: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    units: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    covered: {
      type: Boolean,
      default: true
    }
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'package', 'other'],
    default: 'insurance'
  },

  // Digital Signature
  signature: {
    data: String, // Base64 encoded signature
    timestamp: Date,
    ipAddress: String
  },

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
    createdAt: {
      type: Date,
      default: Date.now
    }
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
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    trim: true
  }

}, {
  timestamps: true
});

// Indexes for performance
appointmentSchema.index({ clinicId: 1, date: 1, status: 1 });
appointmentSchema.index({ clinicId: 1, patientId: 1, date: -1 });
appointmentSchema.index({ clinicId: 1, providerId: 1, date: 1 });
appointmentSchema.index({ clinicId: 1, status: 1, date: 1 });
appointmentSchema.index({ date: 1, time: 1, clinicId: 1 });
appointmentSchema.index({ checkInTime: 1 });
appointmentSchema.index({ checkOutTime: 1 });

// Virtual for appointment duration in minutes
appointmentSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  return null;
});

// Virtual for wait time
appointmentSchema.virtual('waitTime').get(function() {
  if (this.checkInTime && this.actualStartTime) {
    return Math.round((this.actualStartTime - this.checkInTime) / (1000 * 60));
  }
  return null;
});

// Virtual for total visit time
appointmentSchema.virtual('totalVisitTime').get(function() {
  if (this.checkInTime && this.checkOutTime) {
    return Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60));
  }
  return null;
});

// Pre-save middleware to calculate total amount
appointmentSchema.pre('save', function(next) {
  if (this.billingCodes && this.billingCodes.length > 0) {
    this.totalAmount = this.billingCodes.reduce((total, code) => {
      return total + (code.totalPrice || 0);
    }, 0);
  }
  next();
});

// Method to check in patient
appointmentSchema.methods.checkIn = function() {
  this.status = 'checked-in';
  this.checkInTime = new Date();
  return this.save();
};

// Method to start appointment
appointmentSchema.methods.startAppointment = function() {
  this.status = 'in-progress';
  this.actualStartTime = new Date();
  return this.save();
};

// Method to check out patient
appointmentSchema.methods.checkOut = function(billingData, signature, paymentInfo) {
  this.status = 'checked-out';
  this.checkOutTime = new Date();
  
  if (billingData && billingData.length > 0) {
    this.billingCodes = billingData;
  }
  
  if (signature) {
    this.signature = {
      data: signature,
      timestamp: new Date(),
      ipAddress: this.signature?.ipAddress
    };
  }
  
  if (paymentInfo) {
    this.paymentMethod = paymentInfo.method;
    this.amountPaid = paymentInfo.amount;
  }
  
  return this.save();
};

// Static method to get today's appointments
appointmentSchema.statics.getTodaysAppointments = function(clinicId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  
  return this.find({
    clinicId,
    date: { $gte: startOfDay, $lt: endOfDay }
  }).populate('patientId', 'firstName lastName recordNumber phone email');
};

// Static method to get appointments by status
appointmentSchema.statics.getAppointmentsByStatus = function(clinicId, status, date = new Date()) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  
  return this.find({
    clinicId,
    status,
    date: { $gte: startOfDay, $lt: endOfDay }
  }).populate('patientId', 'firstName lastName recordNumber phone email');
};

module.exports = mongoose.model('Appointment', appointmentSchema);
