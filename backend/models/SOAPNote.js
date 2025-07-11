const mongoose = require('mongoose');

const soapNoteSchema = new mongoose.Schema({
  // Reference Information
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // SOAP Components
  subjective: {
    chiefComplaint: {
      type: String,
      trim: true
    },
    historyOfPresentIllness: {
      type: String,
      trim: true
    },
    painScale: {
      type: Number,
      min: 0,
      max: 10
    },
    painLocation: {
      type: String,
      trim: true
    },
    painQuality: {
      type: String,
      trim: true
    },
    aggravatingFactors: {
      type: String,
      trim: true
    },
    alleviatingFactors: {
      type: String,
      trim: true
    },
    reviewOfSystems: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },

  objective: {
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number
    },
    physicalExam: {
      inspection: String,
      palpation: String,
      rangeOfMotion: String,
      neurologicalTests: String,
      orthopedicTests: String
    },
    spinalListings: [{
      level: {
        type: String,
        enum: ['Occiput', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5', 'S1']
      },
      findings: String,
      adjustments: String,
      treatment: String
    }],
    diagnosticTests: {
      xrays: String,
      mri: String,
      ctScan: String,
      other: String
    },
    notes: {
      type: String,
      trim: true
    }
  },

  assessment: {
    primaryDiagnosis: {
      code: String,
      description: String
    },
    secondaryDiagnoses: [{
      code: String,
      description: String
    }],
    clinicalImpression: {
      type: String,
      trim: true
    },
    prognosis: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Guarded'],
      default: 'Good'
    },
    notes: {
      type: String,
      trim: true
    }
  },

  plan: {
    treatmentPlan: {
      type: String,
      trim: true
    },
    procedures: [{
      code: String,
      description: String,
      units: {
        type: Number,
        default: 1
      }
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    homeExercises: {
      type: String,
      trim: true
    },
    restrictions: {
      type: String,
      trim: true
    },
    followUpInstructions: {
      type: String,
      trim: true
    },
    nextAppointment: {
      recommended: Boolean,
      timeframe: String,
      notes: String
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // Templates and Quick Notes
  templates: [{
    name: String,
    content: String,
    section: {
      type: String,
      enum: ['subjective', 'objective', 'assessment', 'plan']
    }
  }],

  // Digital Signature and Completion
  isSigned: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date
  },
  signedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  digitalSignature: {
    type: String // Base64 encoded signature image
  },

  // Auto-save and Version Control
  lastAutoSave: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  isComplete: {
    type: Boolean,
    default: false
  },

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
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    changes: String,
    section: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
soapNoteSchema.index({ appointmentId: 1 });
soapNoteSchema.index({ patientId: 1, createdAt: -1 });
soapNoteSchema.index({ clinicId: 1, createdAt: -1 });
soapNoteSchema.index({ providerId: 1, createdAt: -1 });
soapNoteSchema.index({ isSigned: 1 });

// Virtual for completion percentage
soapNoteSchema.virtual('completionPercentage').get(function() {
  let completed = 0;
  let total = 4; // S, O, A, P sections

  if (this.subjective && (this.subjective.chiefComplaint || this.subjective.notes)) completed++;
  if (this.objective && (this.objective.physicalExam || this.objective.notes)) completed++;
  if (this.assessment && (this.assessment.primaryDiagnosis || this.assessment.notes)) completed++;
  if (this.plan && (this.plan.treatmentPlan || this.plan.notes)) completed++;

  return Math.round((completed / total) * 100);
});

// Pre-save middleware for auto-save tracking
soapNoteSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastAutoSave = new Date();
    this.version += 1;
  }
  next();
});

// Method to mark as complete
soapNoteSchema.methods.markComplete = function() {
  this.isComplete = true;
  this.isSigned = true;
  this.signedAt = new Date();
  return this.save();
};

// Method to add modification history
soapNoteSchema.methods.addModification = function(userId, changes, section) {
  this.modificationHistory.push({
    modifiedBy: userId,
    changes,
    section,
    modifiedAt: new Date()
  });
  this.lastModifiedBy = userId;
  return this.save();
};

module.exports = mongoose.model('SOAPNote', soapNoteSchema);
