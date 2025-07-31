require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

async function createTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find or create test clinic - handle existing data
    let testClinic = await Clinic.findOne({ 
      $or: [
        { clinicCode: 'TEST' },
        { clinicId: 'TEST' }
      ]
    });
    
    if (!testClinic) {
      // Try to find any existing clinic to use as test
      testClinic = await Clinic.findOne({});
      
      if (!testClinic) {
        // Create new clinic only if none exists
        testClinic = new Clinic({
          clinicName: 'Test Clinic',
          name: 'Test Clinic',
          clinicCode: 'TEST',
          clinicId: 'TEST',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          },
          contact: {
            phone: '555-0123',
            email: 'test@testclinic.com'
          }
        });
        await testClinic.save();
        console.log('✅ Test clinic created with ID:', testClinic._id);
      } else {
        console.log('✅ Using existing clinic as test clinic:', testClinic.clinicCode || testClinic.clinicId);
      }
    } else {
      console.log('✅ Test clinic already exists with ID:', testClinic._id);
    }

    // Create test user
    let testUser = await User.findOne({ username: 'testdoc' });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      testUser = new User({
        username: 'testdoc',
        email: 'testdoc@test.com',
        password: hashedPassword,
        role: 'doctor',
        clinicId: testClinic._id,
        isActive: true,
        profile: {
          firstName: 'Test',
          lastName: 'Doctor'
        }
      });
      await testUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }

    console.log('\n🎉 Test account ready!');
    console.log('Username: testdoc');
    console.log('Password: password123');
    console.log('Clinic Code:', testClinic.clinicCode || testClinic.clinicId || 'TEST');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
