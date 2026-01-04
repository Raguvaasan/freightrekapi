const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://freightrek_db_user:YUmKs8jxFygB12F7@cluster0.2c2cw2h.mongodb.net/freightrek';

async function resetPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const AdminUser = mongoose.model('AdminUser', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }, { collection: 'adminusers' }));

    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await AdminUser.updateOne(
      { email: 'admin@freightrek.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Password reset successful!');
      console.log('📧 Email: admin@freightrek.com');
      console.log('🔑 New Password: Admin@123');
      
      // Verify the new password
      const user = await AdminUser.findOne({ email: 'admin@freightrek.com' }).select('+password');
      const isMatch = await bcrypt.compare(newPassword, user.password);
      console.log(`\n✔️  Verification: ${isMatch ? 'Password works!' : 'Failed'}`);
    } else {
      console.log('⚠️  No changes made');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

resetPassword();
