const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freightrek')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas
const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true, unique: true },
  permissions: Array,
  status: { type: Boolean, default: true },
  isRoot: { type: Boolean, default: false }
}, { timestamps: true });

const adminUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNo: { type: String, required: true },
  password: { type: String, required: true },
  status: { type: Boolean, default: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminRole', required: true }
}, { timestamps: true });

const Role = mongoose.model('AdminRole', roleSchema);
const AdminUser = mongoose.model('AdminUser', adminUserSchema);

async function verifyLogin() {
  try {
    const email = 'admin@freightrek.com';
    
    console.log(`\n🔍 Checking login for: ${email}\n`);
    
    // Get user with password field
    const user = await AdminUser.findOne({ email }).select('+password').populate('roleId');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User Details:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Phone:', user.phoneNo);
    console.log('   Status:', user.status ? '✅ Active' : '❌ Inactive');
    console.log('   Has Password:', user.password ? '✅ Yes' : '❌ No');
    console.log('   Password Hash:', user.password ? user.password.substring(0, 20) + '...' : 'N/A');
    
    if (user.roleId) {
      console.log('\n✅ Role Details:');
      console.log('   Role Name:', user.roleId.roleName);
      console.log('   Role Status:', user.roleId.status ? '✅ Active' : '❌ Inactive');
      console.log('   Is Root:', user.roleId.isRoot ? '✅ Yes' : 'No');
      console.log('   Permissions:', user.roleId.permissions.length, 'modules');
    } else {
      console.log('\n❌ No role assigned!');
    }
    
    // Check if status is active
    if (!user.status) {
      console.log('\n⚠️  WARNING: User account is INACTIVE!');
      console.log('   Activating user...');
      user.status = true;
      await user.save();
      console.log('   ✅ User activated');
    }
    
    // Check if role is active
    if (user.roleId && !user.roleId.status) {
      console.log('\n⚠️  WARNING: Role is INACTIVE!');
      console.log('   Activating role...');
      await Role.findByIdAndUpdate(user.roleId._id, { status: true });
      console.log('   ✅ Role activated');
    }
    
    console.log('\n✅ Login setup is correct!');
    console.log('\n📝 You can now login with:');
    console.log('   Email: admin@freightrek.com');
    console.log('   Password: Admin@123 (or the password you set)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
verifyLogin();
