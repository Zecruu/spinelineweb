require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

async function verifyUserData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the clinic
    const clinic = await Clinic.findOne({ 
      $or: [
        { clinicCode: 'DRAAIV' },
        { clinicId: 'DRAAIV' }
      ]
    });
    
    console.log('\n🏥 CLINIC DATA:');
    if (clinic) {
      console.log('- Found clinic:', {
        _id: clinic._id,
        name: clinic.clinicName || clinic.name,
        clinicCode: clinic.clinicCode,
        clinicId: clinic.clinicId
      });
    } else {
      console.log('❌ No clinic found with code DRAAIV');
    }

    // Find the test user
    const user = await User.findOne({ username: 'testdoc' });
    
    console.log('\n👤 USER DATA:');
    if (user) {
      console.log('- Found user:', {
        _id: user._id,
        username: user.username,
        email: user.email,
        clinicId: user.clinicId,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        hasPasswordHash: !!user.passwordHash
      });
      
      // Test password verification
      console.log('\n🔐 PASSWORD VERIFICATION:');
      const testPassword = 'password123';
      
      if (user.password) {
        const isValidPassword = await bcrypt.compare(testPassword, user.password);
        console.log('- Password field verification:', isValidPassword ? '✅ VALID' : '❌ INVALID');
      }
      
      if (user.passwordHash) {
        const isValidPasswordHash = await bcrypt.compare(testPassword, user.passwordHash);
        console.log('- PasswordHash field verification:', isValidPasswordHash ? '✅ VALID' : '❌ INVALID');
      }
      
      // Check clinic linkage
      console.log('\n🔗 CLINIC LINKAGE:');
      if (clinic && user.clinicId) {
        const clinicMatch = user.clinicId.toString() === clinic._id.toString();
        console.log('- User clinicId matches clinic _id:', clinicMatch ? '✅ MATCH' : '❌ NO MATCH');
        console.log('- User clinicId:', user.clinicId);
        console.log('- Clinic _id:', clinic._id);
      }
      
    } else {
      console.log('❌ No user found with username testdoc');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error verifying user data:', error);
    process.exit(1);
  }
}

verifyUserData();
