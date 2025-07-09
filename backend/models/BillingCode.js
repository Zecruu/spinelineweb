const mongoose = require('mongoose');

const billingCodeSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  units: {
    type: Number,
    default: 1,
    min: 1
  },
  insuranceCovered: {
    type: Boolean,
    default: false
  },
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
billingCodeSchema.index({ appointmentId: 1 });
billingCodeSchema.index({ clinicId: 1 });
billingCodeSchema.index({ code: 1 });

// Virtual for total amount
billingCodeSchema.virtual('totalAmount').get(function() {
  return this.price * this.units;
});

// Ensure virtual fields are serialized
billingCodeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('BillingCode', billingCodeSchema);
