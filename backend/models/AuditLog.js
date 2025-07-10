const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
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
  ledgerEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger',
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
    enum: ['New', 'Regular', 'Re-Eval', 'Walk-In', 'Follow-Up', 'Consultation', 'Decompression', 'Chiropractic', 'Evaluation'],
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

  // Clinical Documentation
  soapNote: {
    subjective: {
      type: String,
      trim: true,
      maxlength: [2000, 'Subjective notes cannot exceed 2000 characters']
    },
    objective: {
      type: String,
      trim: true,
      maxlength: [2000, 'Objective notes cannot exceed 2000 characters']
    },
    assessment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Assessment cannot exceed 1000 characters']
    },
    plan: {
      type: String,
      trim: true,
      maxlength: [1000, 'Plan cannot exceed 1000 characters']
    },
    isComplete: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Billing and Diagnostic Information
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
    modifiers: [String],
    isPreAuthorized: {
      type: Boolean,
      default: false
    }
  }],

  diagnosticCodes: [{
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
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Digital Signature and Compliance
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
    },
    isValid: {
      type: Boolean,
      default: true
    }
  },

  // Payment and Insurance Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'check', 'insurance', 'package', 'credit', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    copayAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    copayOverride: {
      originalAmount: Number,
      newAmount: Number,
      reason: String,
      authorizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    insuranceClaim: {
      claimNumber: String,
      preAuthNumber: String,
      status: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'denied', 'partial'],
        default: 'pending'
      }
    }
  },

  // Care Package Usage
  carePackage: {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CarePackage'
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
    }
  },

  // Compliance Flags
  complianceFlags: {
    missingSignature: {
      type: Boolean,
      default: false
    },
    missingNotes: {
      type: Boolean,
      default: false
    },
    copayOverride: {
      type: Boolean,
      default: false
    },
    lateDocumentation: {
      type: Boolean,
      default: false
    },
    incompleteSOAP: {
      type: Boolean,
      default: false
    },
    missingDiagnosis: {
      type: Boolean,
      default: false
    }
  },

  // Audit Trail
  auditEvents: [{
    eventType: {
      type: String,
      enum: ['created', 'modified', 'viewed', 'exported', 'flagged', 'resolved'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    ipAddress: String,
    userAgent: String,
    changes: mongoose.Schema.Types.Mixed // Store what was changed
  }],

  // Export History
  exports: [{
    exportType: {
      type: String,
      enum: ['pdf', 'csv', 'json'],
      required: true
    },
    exportedAt: {
      type: Date,
      default: Date.now
    },
    exportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: String,
    fileSize: Number,
    purpose: {
      type: String,
      enum: ['audit', 'insurance', 'legal', 'backup', 'report'],
      required: true
    }
  }],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockReason: String

}, {
  timestamps: true
});

// Indexes for performance and compliance queries
auditLogSchema.index({ clinicId: 1, visitDate: -1 });
auditLogSchema.index({ clinicId: 1, patientId: 1, visitDate: -1 });
auditLogSchema.index({ clinicId: 1, providerId: 1, visitDate: -1 });
auditLogSchema.index({ appointmentId: 1 });
auditLogSchema.index({ ledgerEntryId: 1 });
auditLogSchema.index({ 'complianceFlags.missingSignature': 1, clinicId: 1 });
auditLogSchema.index({ 'complianceFlags.missingNotes': 1, clinicId: 1 });
auditLogSchema.index({ 'complianceFlags.copayOverride': 1, clinicId: 1 });
auditLogSchema.index({ 'signature.isValid': 1, clinicId: 1 });
auditLogSchema.index({ 'soapNote.isComplete': 1, clinicId: 1 });

// Pre-save middleware to set compliance flags
auditLogSchema.pre('save', function(next) {
  // Check for missing signature
  this.complianceFlags.missingSignature = !this.signature || !this.signature.data;
  
  // Check for missing or incomplete SOAP notes
  const soap = this.soapNote;
  this.complianceFlags.missingNotes = !soap || (!soap.subjective && !soap.objective && !soap.assessment && !soap.plan);
  this.complianceFlags.incompleteSOAP = soap && (!soap.subjective || !soap.objective || !soap.assessment || !soap.plan);
  
  // Check for copay override
  this.complianceFlags.copayOverride = this.payment && this.payment.copayOverride && this.payment.copayOverride.originalAmount !== this.payment.copayOverride.newAmount;
  
  // Check for late documentation (more than 24 hours after visit)
  if (this.visitDate) {
    const hoursSinceVisit = (Date.now() - this.visitDate.getTime()) / (1000 * 60 * 60);
    this.complianceFlags.lateDocumentation = hoursSinceVisit > 24 && this.isNew;
  }
  
  // Check for missing diagnosis
  this.complianceFlags.missingDiagnosis = !this.diagnosticCodes || this.diagnosticCodes.length === 0;
  
  next();
});

// Method to add audit event
auditLogSchema.methods.addAuditEvent = function(eventType, userId, description, ipAddress, userAgent, changes) {
  this.auditEvents.push({
    eventType,
    userId,
    description,
    ipAddress,
    userAgent,
    changes
  });
  return this.save();
};

// Method to lock record
auditLogSchema.methods.lockRecord = function(userId, reason) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  this.lockReason = reason;
  return this.save();
};

// Static method to get compliance summary
auditLogSchema.statics.getComplianceSummary = function(clinicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        clinicId,
        visitDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        missingSignatures: { $sum: { $cond: ['$complianceFlags.missingSignature', 1, 0] } },
        missingNotes: { $sum: { $cond: ['$complianceFlags.missingNotes', 1, 0] } },
        copayOverrides: { $sum: { $cond: ['$complianceFlags.copayOverride', 1, 0] } },
        lateDocumentation: { $sum: { $cond: ['$complianceFlags.lateDocumentation', 1, 0] } },
        incompleteSOAP: { $sum: { $cond: ['$complianceFlags.incompleteSOAP', 1, 0] } },
        missingDiagnosis: { $sum: { $cond: ['$complianceFlags.missingDiagnosis', 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
