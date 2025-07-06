const mongoose = require('mongoose');

const appointmentHistorySchema = new mongoose.Schema({
  // Clinic and Appointment Association
  clinicId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    ref: 'Clinic',
    required: [true, 'Clinic ID is required'],
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },

  // Change Information
  changeType: {
    type: String,
    enum: ['reschedule', 'cancel', 'modify', 'create', 'check-in', 'check-out', 'no-show'],
    required: [true, 'Change type is required'],
    index: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },

  // Previous Values (for tracking what changed)
  previousValues: {
    date: Date,
    time: String,
    visitType: String,
    status: String,
    providerId: mongoose.Schema.Types.ObjectId,
    notes: String,
    color: String
  },

  // New Values (what it changed to)
  newValues: {
    date: Date,
    time: String,
    visitType: String,
    status: String,
    providerId: mongoose.Schema.Types.ObjectId,
    notes: String,
    color: String
  },

  // Reschedule Specific Information
  rescheduleDetails: {
    originalDate: Date,
    originalTime: String,
    newDate: Date,
    newTime: String,
    rescheduleReason: {
      type: String,
      enum: ['patient-request', 'provider-unavailable', 'emergency', 'illness', 'scheduling-conflict', 'other'],
      default: 'patient-request'
    },
    initiatedBy: {
      type: String,
      enum: ['patient', 'provider', 'staff', 'system'],
      default: 'staff'
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationMethod: {
      type: String,
      enum: ['email', 'sms', 'phone', 'in-person', 'none'],
      default: 'none'
    }
  },

  // Cancellation Specific Information
  cancellationDetails: {
    cancellationReason: {
      type: String,
      enum: ['patient-request', 'provider-unavailable', 'emergency', 'illness', 'no-show', 'other'],
      default: 'patient-request'
    },
    refundRequired: {
      type: Boolean,
      default: false
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    refundProcessed: {
      type: Boolean,
      default: false
    },
    noShowFee: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // System Information
  changedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Changed by user is required']
  },
  ipAddress: String,
  userAgent: String,

  // Additional Context
  systemGenerated: {
    type: Boolean,
    default: false
  },
  batchOperation: {
    type: Boolean,
    default: false
  },
  batchId: String,

  // Communication
  patientNotified: {
    type: Boolean,
    default: false
  },
  providerNotified: {
    type: Boolean,
    default: false
  },
  notificationDetails: {
    emailSent: {
      type: Boolean,
      default: false
    },
    smsSent: {
      type: Boolean,
      default: false
    },
    emailAddress: String,
    phoneNumber: String,
    sentAt: Date
  },

  // Audit and Compliance
  complianceFlags: [{
    flag: {
      type: String,
      enum: ['late-cancellation', 'no-show', 'frequent-reschedule', 'insurance-issue'],
      required: true
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes and Comments
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  patientComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Patient comments cannot exceed 500 characters']
  }

}, {
  timestamps: true
});

// Indexes for performance
appointmentHistorySchema.index({ clinicId: 1, changedAt: -1 });
appointmentHistorySchema.index({ clinicId: 1, appointmentId: 1, changedAt: -1 });
appointmentHistorySchema.index({ clinicId: 1, patientId: 1, changedAt: -1 });
appointmentHistorySchema.index({ clinicId: 1, changeType: 1, changedAt: -1 });
appointmentHistorySchema.index({ changedBy: 1, changedAt: -1 });
appointmentHistorySchema.index({ 'rescheduleDetails.originalDate': 1 });
appointmentHistorySchema.index({ 'cancellationDetails.cancellationReason': 1 });

// Virtual for change summary
appointmentHistorySchema.virtual('changeSummary').get(function() {
  switch (this.changeType) {
    case 'reschedule':
      return `Rescheduled from ${this.previousValues?.date} ${this.previousValues?.time} to ${this.newValues?.date} ${this.newValues?.time}`;
    case 'cancel':
      return `Cancelled appointment on ${this.previousValues?.date} ${this.previousValues?.time}`;
    case 'modify':
      return `Modified appointment details`;
    case 'create':
      return `Created new appointment for ${this.newValues?.date} ${this.newValues?.time}`;
    case 'check-in':
      return `Patient checked in`;
    case 'check-out':
      return `Patient checked out`;
    case 'no-show':
      return `Patient marked as no-show`;
    default:
      return `Appointment ${this.changeType}`;
  }
});

// Static method to log appointment change
appointmentHistorySchema.statics.logChange = function(appointmentId, changeType, previousValues, newValues, changedBy, reason, additionalData = {}) {
  const historyEntry = new this({
    clinicId: previousValues?.clinicId || newValues?.clinicId,
    appointmentId,
    patientId: previousValues?.patientId || newValues?.patientId,
    changeType,
    reason,
    previousValues,
    newValues,
    changedBy,
    changedAt: new Date(),
    ...additionalData
  });
  
  return historyEntry.save();
};

// Static method to get appointment history
appointmentHistorySchema.statics.getAppointmentHistory = function(appointmentId) {
  return this.find({ appointmentId })
    .populate('changedBy', 'username email profile.firstName profile.lastName')
    .sort({ changedAt: -1 });
};

// Static method to get patient appointment history
appointmentHistorySchema.statics.getPatientHistory = function(clinicId, patientId, limit = 50) {
  return this.find({ clinicId, patientId })
    .populate('appointmentId', 'date time visitType')
    .populate('changedBy', 'username email')
    .sort({ changedAt: -1 })
    .limit(limit);
};

// Static method to get clinic statistics
appointmentHistorySchema.statics.getClinicStats = function(clinicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        clinicId,
        changedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$changeType',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('AppointmentHistory', appointmentHistorySchema);
