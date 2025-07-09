const mongoose = require('mongoose');

const carePackageSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1
  },
  remainingSessions: {
    type: Number,
    required: true,
    min: 0
  },
  packageType: {
    type: String,
    enum: ['decompression', 'chiropractic', 'therapy', 'wellness'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  linkedBillingCodes: [{
    type: String,
    trim: true
  }],
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'completed', 'cancelled'],
    default: 'active'
  },
  sessionHistory: [{
    usedDate: {
      type: Date,
      default: Date.now
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    billingCodes: [String],
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
carePackageSchema.index({ patientId: 1 });
carePackageSchema.index({ clinicId: 1 });
carePackageSchema.index({ status: 1 });
carePackageSchema.index({ packageType: 1 });

// Virtual for sessions used
carePackageSchema.virtual('sessionsUsed').get(function() {
  return this.totalSessions - this.remainingSessions;
});

// Virtual for completion percentage
carePackageSchema.virtual('completionPercentage').get(function() {
  return ((this.totalSessions - this.remainingSessions) / this.totalSessions) * 100;
});

// Virtual for package status based on remaining sessions
carePackageSchema.virtual('packageStatus').get(function() {
  const percentage = this.completionPercentage;
  if (this.remainingSessions === 0) return 'completed';
  if (percentage > 80) return 'critical';
  if (percentage > 50) return 'warning';
  return 'active';
});

// Method to use a session
carePackageSchema.methods.useSession = function(appointmentId, billingCodes, usedBy, notes) {
  if (this.remainingSessions <= 0) {
    throw new Error('No remaining sessions in this care package');
  }
  
  this.remainingSessions -= 1;
  this.sessionHistory.push({
    appointmentId,
    billingCodes,
    usedBy,
    notes
  });
  
  if (this.remainingSessions === 0) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Ensure virtual fields are serialized
carePackageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CarePackage', carePackageSchema);
