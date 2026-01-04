const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://freightrek_db_user:YUmKs8jxFygB12F7@cluster0.2c2cw2h.mongodb.net/freightrek';

async function checkAdminUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const AdminUser = mongoose.model('AdminUser', new mongoose.Schema({
      name: String,
      email: String,
      phoneNo: String,
      status: Boolean,
      roleId: mongoose.Schema.Types.ObjectId,
    }, { collection: 'adminusers' }));

    const Role = mongoose.model('AdminRole', new mongoose.Schema({
      roleName: String,
      status: Boolean,
      permissions: [String]
    }, { collection: 'adminroles' }));

    const users = await AdminUser.find({}).populate('roleId').lean();
    const totalUsers = await AdminUser.countDocuments();

    console.log(`📊 Total Admin Users: ${totalUsers}\n`);

    if (users.length > 0) {
      console.log('👥 Admin Users List:');
      console.log('='.repeat(80));
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phoneNo}`);
        console.log(`   Status: ${user.status ? '✅ Active' : '❌ Inactive'}`);
        console.log(`   Role: ${user.roleId ? user.roleId.roleName : 'N/A'}`);
      });
      console.log('\n' + '='.repeat(80));
    } else {
      console.log('⚠️  No admin users found in database');
    }

    // Check roles too
    const roles = await Role.find({}).lean();
    console.log(`\n📋 Total Roles: ${roles.length}`);
    if (roles.length > 0) {
      console.log('\n🔐 Roles List:');
      roles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.roleName} (${role.status ? 'Active' : 'Inactive'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkAdminUsers();
