const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true,
    maxlength: [100, 'Clinic name cannot exceed 100 characters']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String }
  },
  settings: {
    timezone: { type: String, default: 'America/New_York' },
    businessHours: {
      monday: { start: String, end: String, closed: { type: Boolean, default: false } },
      tuesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      wednesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      thursday: { start: String, end: String, closed: { type: Boolean, default: false } },
      friday: { start: String, end: String, closed: { type: Boolean, default: false } },
      saturday: { start: String, end: String, closed: { type: Boolean, default: true } },
      sunday: { start: String, end: String, closed: { type: Boolean, default: true } }
    },
    appointmentDuration: { type: Number, default: 30 }, // minutes
    currency: { type: String, default: 'USD' }
  },
  subscription: {
    plan: { type: String, enum: ['basic', 'professional', 'enterprise'], default: 'basic' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
clinicSchema.index({ 'contact.email': 1 }, { unique: true });
clinicSchema.index({ isActive: 1 });
clinicSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('Clinic', clinicSchema);
