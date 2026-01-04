const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://freightrek_db_user:YUmKs8jxFygB12F7@cluster0.2c2cw2h.mongodb.net/freightrek';

async function verifyPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const AdminUser = mongoose.model('AdminUser', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }, { collection: 'adminusers' }));

    const user = await AdminUser.findOne({ email: 'admin@freightrek.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📝 Name:', user.name);
    
    // Test passwords
    const testPasswords = ['Admin@123', 'admin@123', 'Admin123', 'admin123', 'password'];
    
    console.log('\n🔐 Testing passwords:');
    console.log('='.repeat(60));
    
    for (const pwd of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(pwd, user.password);
        console.log(`${pwd.padEnd(20)} → ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
      } catch (err) {
        console.log(`${pwd.padEnd(20)} → ⚠️  Error: ${err.message}`);
      }
    }

    console.log('\n📌 Stored hash:', user.password.substring(0, 30) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifyPassword();
