const mongoose = require('mongoose');

const diagnosticCodeSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
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
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'Severe'],
    default: 'Moderate'
  },
  laterality: {
    type: String,
    enum: ['Left', 'Right', 'Bilateral', 'Central', 'N/A'],
    default: 'N/A'
  },
  notes: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
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
diagnosticCodeSchema.index({ appointmentId: 1 });
diagnosticCodeSchema.index({ clinicId: 1 });
diagnosticCodeSchema.index({ code: 1 });

module.exports = mongoose.model('DiagnosticCode', diagnosticCodeSchema);
