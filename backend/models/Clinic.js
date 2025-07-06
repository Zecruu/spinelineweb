const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  // Support both old and new naming conventions
  clinicName: {
    type: String,
    trim: true,
    maxlength: [100, 'Clinic name cannot exceed 100 characters']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Clinic name cannot exceed 100 characters']
  },
  clinicId: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: [3, 'Clinic ID must be at least 3 characters'],
    maxlength: [10, 'Clinic ID cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Clinic ID must contain only uppercase letters and numbers']
  },
  clinicCode: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: [3, 'Clinic code must be at least 3 characters'],
    maxlength: [10, 'Clinic code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Clinic code must contain only uppercase letters and numbers']
  },
  // Support both address structures
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'USA' }
  },
  contactInfo: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'USA' }
    }
  },
  contact: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' }
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
clinicSchema.index({ clinicId: 1 }, { unique: true, sparse: true });
clinicSchema.index({ clinicCode: 1 }, { unique: true, sparse: true });
clinicSchema.index({ 'contact.email': 1 }, { sparse: true });
clinicSchema.index({ 'contactInfo.email': 1 }, { sparse: true });
clinicSchema.index({ isActive: 1 });
clinicSchema.index({ 'subscription.status': 1 });

// Virtual to get the clinic identifier (either clinicId or clinicCode)
clinicSchema.virtual('identifier').get(function() {
  return this.clinicId || this.clinicCode;
});

// Virtual to get the clinic name (either clinicName or name)
clinicSchema.virtual('displayName').get(function() {
  return this.clinicName || this.name;
});

// Virtual to get the clinic email (from either contact structure)
clinicSchema.virtual('email').get(function() {
  return this.contactInfo?.email || this.contact?.email || '';
});

// Auto-generate clinic code/ID if not provided
clinicSchema.pre('save', async function(next) {
  if (this.isNew && !this.clinicCode && !this.clinicId) {
    // Generate a random 6-character clinic code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if this code already exists in either field
      const existing = await this.constructor.findOne({
        $or: [{ clinicCode: result }, { clinicId: result }]
      });
      if (!existing) {
        this.clinicCode = result;
        this.clinicId = result;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return next(new Error('Unable to generate unique clinic code'));
    }
  }
  next();
});

module.exports = mongoose.model('Clinic', clinicSchema);
