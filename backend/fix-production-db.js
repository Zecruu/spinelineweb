// Production Database Fix Script
// This script connects directly to the production MongoDB and fixes the user password hash

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define schemas inline to avoid dependency issues
const clinicSchema = new mongoose.Schema({
  clinicName: String,
  name: String,
  clinicCode: String,
  clinicId: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  contact: {
    phone: String,
    email: String
  }
}, { collection: 'clinics' });

const userSchema = new mongoose.Schema({
  clinicId: mongoose.Schema.Types.ObjectId,
  name: String,
  username: String,
  email: String,
  password: String,
  passwordHash: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    licenseNumber: String,
    specialization: String,
    department: String
  },
  isActive: { type: Boolean, default: true }
}, { collection: 'users' });

async function fixProductionDatabase() {
  try {
    console.log('🔧 Starting production database fix...');
    
    // Use production MongoDB URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('No MongoDB URI found in environment variables');
    }
    
    console.log('🔗 Connecting to production database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to production MongoDB');
    
    const Clinic = mongoose.model('Clinic', clinicSchema);
    const User = mongoose.model('User', userSchema);
    
    // Find any clinic to use (preferably DRAAIV)
    let clinic = await Clinic.findOne({
      $or: [
        { clinicCode: 'DRAAIV' },
        { clinicId: 'DRAAIV' }
      ]
    });
    
    if (!clinic) {
      clinic = await Clinic.findOne({});
      if (!clinic) {
        throw new Error('No clinic found in production database');
      }
    }
    
    console.log('🏥 Using clinic:', {
      id: clinic._id,
      name: clinic.clinicName || clinic.name,
      code: clinic.clinicCode || clinic.clinicId
    });
    
    // Create correct password hash
    const correctPassword = 'password123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    console.log('🔐 Generated new password hash');
    
    // Find or create test user
    let user = await User.findOne({ username: 'testdoc' });
    
    if (!user) {
      // Create new user
      user = new User({
        username: 'testdoc',
        email: 'testdoc@test.com',
        password: hashedPassword,
        passwordHash: hashedPassword,
        role: 'doctor',
        clinicId: clinic._id,
        isActive: true,
        profile: {
          firstName: 'Test',
          lastName: 'Doctor'
        }
      });
      
      await user.save();
      console.log('✅ Created new test user in production');
    } else {
      // Update existing user
      await User.updateOne(
        { _id: user._id },
        {
          password: hashedPassword,
          passwordHash: hashedPassword,
          clinicId: clinic._id,
          isActive: true
        }
      );
      console.log('✅ Updated existing test user password in production');
    }
    
    // Verify the fix
    const updatedUser = await User.findOne({ username: 'testdoc' });
    const passwordValid = await bcrypt.compare(correctPassword, updatedUser.password);
    
    if (!passwordValid) {
      throw new Error('Password verification failed after update');
    }
    
    console.log('🎉 PRODUCTION FIX SUCCESSFUL!');
    console.log('');
    console.log('📋 LOGIN CREDENTIALS FOR PRODUCTION:');
    console.log('   Username: testdoc');
    console.log('   Password: password123');
    console.log('   Clinic Code:', clinic.clinicCode || clinic.clinicId || 'DRAAIV');
    console.log('');
    console.log('✅ Password hash verified in production database');
    console.log('✅ User is active and linked to clinic');
    console.log('🚀 Production login should now work!');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from production database');
    
  } catch (error) {
    console.error('❌ Production database fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixProductionDatabase();
