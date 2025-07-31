require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function debugPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ username: 'testdoc' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n🔐 PASSWORD DEBUG:');
    console.log('- User password field:', user.password);
    console.log('- User passwordHash field:', user.passwordHash);
    
    // Test manual password hashing
    const testPassword = 'password123';
    console.log('- Test password:', testPassword);
    
    // Create a fresh hash
    const freshHash = await bcrypt.hash(testPassword, 10);
    console.log('- Fresh hash:', freshHash);
    
    // Test fresh hash
    const freshHashValid = await bcrypt.compare(testPassword, freshHash);
    console.log('- Fresh hash verification:', freshHashValid ? '✅ VALID' : '❌ INVALID');
    
    // Test existing hashes
    if (user.password) {
      console.log('\n🔍 Testing existing password field:');
      console.log('- Stored hash:', user.password);
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('- Verification result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      // Check if it's actually hashed
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      console.log('- Appears to be bcrypt hash:', isHashed ? '✅ YES' : '❌ NO');
    }
    
    if (user.passwordHash) {
      console.log('\n🔍 Testing existing passwordHash field:');
      console.log('- Stored hash:', user.passwordHash);
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      console.log('- Verification result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      // Check if it's actually hashed
      const isHashed = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');
      console.log('- Appears to be bcrypt hash:', isHashed ? '✅ YES' : '❌ NO');
    }

    // Fix the password by updating with correct hash
    console.log('\n🔧 FIXING PASSWORD:');
    const correctHash = await bcrypt.hash(testPassword, 10);
    
    await User.updateOne(
      { _id: user._id },
      { 
        password: correctHash,
        passwordHash: correctHash
      }
    );
    
    console.log('✅ Password updated with correct hash');
    
    // Verify the fix
    const updatedUser = await User.findOne({ username: 'testdoc' });
    const verifyFixed = await bcrypt.compare(testPassword, updatedUser.password);
    console.log('✅ Fixed password verification:', verifyFixed ? '✅ VALID' : '❌ STILL INVALID');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error debugging password:', error);
    process.exit(1);
  }
}

debugPassword();
