const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
    index: true
  },

  // Visit Information
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    index: true
  },
  visitType: {
    type: String,
    enum: ['New', 'Regular', 'Re-Eval', 'Walk-In', 'Follow-Up', 'Consultation'],
    required: [true, 'Visit type is required']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  providerName: {
    type: String,
    required: true,
    trim: true
  },

  // Billing Information
  billingCodes: [{
    code: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    units: {
      type: Number,
      required: true,
      min: 1,
      default: 1
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
    },
    insuranceCoverage: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
      },
      copay: {
        type: Number,
        min: 0,
        default: 0
      },
      deductible: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  }],

  // Financial Summary
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discounts: [{
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'package', 'insurance'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'check', 'insurance', 'package', 'credit', 'other'],
    required: [true, 'Payment method is required']
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  changeGiven: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'overdue'],
    default: 'paid'
  },

  // Insurance Information
  insurance: {
    primary: {
      companyName: String,
      policyNumber: String,
      groupNumber: String,
      copayAmount: {
        type: Number,
        min: 0,
        default: 0
      },
      deductibleMet: {
        type: Number,
        min: 0,
        default: 0
      },
      coveragePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
      }
    },
    secondary: {
      companyName: String,
      policyNumber: String,
      groupNumber: String,
      coveragePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    claimNumber: String,
    preAuthNumber: String,
    claimStatus: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'partial'],
      default: 'pending'
    }
  },

  // Care Package Information
  carePackage: {
    packageId: {
      type: mongoose.Schema.Types.ObjectId
    },
    packageName: String,
    visitsUsed: {
      type: Number,
      min: 0,
      default: 0
    },
    visitsRemaining: {
      type: Number,
      min: 0
    },
    packageDiscount: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // Referral Information
  referral: {
    referringDoctor: String,
    referralNumber: String,
    visitsAuthorized: {
      type: Number,
      min: 0
    },
    visitsUsed: {
      type: Number,
      min: 0,
      default: 0
    },
    visitsRemaining: {
      type: Number,
      min: 0
    },
    expirationDate: Date,
    isExpired: {
      type: Boolean,
      default: false
    }
  },

  // Digital Signature
  signature: {
    data: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    signedBy: {
      type: String,
      required: true,
      trim: true
    }
  },

  // Visit Notes and Documentation
  visitNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Visit notes cannot exceed 2000 characters']
  },
  treatmentProvided: [{
    type: String,
    trim: true
  }],
  homeExercises: [{
    exercise: String,
    sets: Number,
    reps: Number,
    duration: String,
    frequency: String
  }],

  // Follow-up and Next Steps
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    recommendedDate: Date,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'as-needed'],
      default: 'weekly'
    },
    notes: String
  },

  // Alerts and Flags
  alerts: [{
    type: {
      type: String,
      enum: ['billing', 'insurance', 'referral', 'payment', 'follow-up', 'general'],
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
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: Date,
  voidReason: String,
  isVoided: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// Indexes for performance
ledgerSchema.index({ clinicId: 1, visitDate: -1 });
ledgerSchema.index({ clinicId: 1, patientId: 1, visitDate: -1 });
ledgerSchema.index({ clinicId: 1, providerId: 1, visitDate: -1 });
ledgerSchema.index({ appointmentId: 1 });
ledgerSchema.index({ paymentStatus: 1, clinicId: 1 });
ledgerSchema.index({ 'insurance.claimStatus': 1, clinicId: 1 });
ledgerSchema.index({ isVoided: 1, clinicId: 1 });

// Virtual for outstanding balance
ledgerSchema.virtual('outstandingBalance').get(function() {
  return Math.max(0, this.totalAmount - this.amountPaid);
});

// Virtual for profit margin
ledgerSchema.virtual('profitMargin').get(function() {
  if (this.totalAmount > 0) {
    return ((this.amountPaid - this.totalDiscount) / this.totalAmount) * 100;
  }
  return 0;
});

// Pre-save middleware to calculate totals
ledgerSchema.pre('save', function(next) {
  // Calculate subtotal from billing codes
  if (this.billingCodes && this.billingCodes.length > 0) {
    this.subtotal = this.billingCodes.reduce((total, code) => {
      return total + (code.totalPrice || 0);
    }, 0);
  }

  // Calculate total discount
  if (this.discounts && this.discounts.length > 0) {
    this.totalDiscount = this.discounts.reduce((total, discount) => {
      return total + (discount.amount || 0);
    }, 0);
  }

  // Calculate final total amount
  this.totalAmount = Math.max(0, this.subtotal - this.totalDiscount);

  // Calculate balance
  this.balance = this.totalAmount - this.amountPaid;

  // Update payment status based on balance
  if (this.balance <= 0) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'pending';
  }

  next();
});

// Method to void entry
ledgerSchema.methods.voidEntry = function(voidedBy, reason) {
  this.isVoided = true;
  this.voidedBy = voidedBy;
  this.voidedAt = new Date();
  this.voidReason = reason;
  return this.save();
};

// Static method to get clinic revenue for date range
ledgerSchema.statics.getClinicRevenue = function(clinicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        clinicId,
        visitDate: { $gte: startDate, $lte: endDate },
        isVoided: false
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
        totalBilled: { $sum: '$totalAmount' },
        totalVisits: { $sum: 1 },
        averageVisitValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

// Static method to get outstanding balances
ledgerSchema.statics.getOutstandingBalances = function(clinicId) {
  return this.find({
    clinicId,
    balance: { $gt: 0 },
    isVoided: false
  }).populate('patientId', 'firstName lastName recordNumber phone email');
};

module.exports = mongoose.model('Ledger', ledgerSchema);
