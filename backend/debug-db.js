require('dotenv').config();
const mongoose = require('mongoose');

async function debugDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    // Get database instance
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Total Collections: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`\n🗂️  Collection: ${collection.name}`);
      
      // Get collection instance
      const coll = db.collection(collection.name);
      
      // Count documents
      const count = await coll.countDocuments();
      console.log(`   📊 Document count: ${count}`);
      
      if (count > 0) {
        // Get sample documents
        const samples = await coll.find({}).limit(3).toArray();
        console.log(`   📄 Sample documents:`);
        samples.forEach((doc, index) => {
          console.log(`      ${index + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });
      }
    }

    // Check specifically for clinic and user related collections
    console.log('\n🔍 Checking for clinic/user data...');
    
    const clinicCollections = collections.filter(c => 
      c.name.toLowerCase().includes('clinic') || 
      c.name.toLowerCase().includes('user') ||
      c.name.toLowerCase().includes('practice')
    );
    
    if (clinicCollections.length > 0) {
      console.log('🏥 Found potential clinic/user collections:');
      for (const coll of clinicCollections) {
        console.log(`   - ${coll.name}`);
        const data = await db.collection(coll.name).find({}).limit(5).toArray();
        console.log(`     Sample data: ${JSON.stringify(data, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('❌ Database debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugDatabase();
