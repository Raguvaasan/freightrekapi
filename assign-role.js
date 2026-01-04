const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freightrek')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas
const modulePermissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  read: { type: Boolean, default: false },
  write: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true, unique: true },
  permissions: { type: [modulePermissionSchema], required: true },
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

async function assignRole() {
  try {
    const email = 'admin@freightrek.com';
    
    // Check if user exists
    console.log(`\nLooking for user: ${email}`);
    const user = await AdminUser.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:', {
      name: user.name,
      email: user.email,
      currentRoleId: user.roleId,
      status: user.status
    });
    
    // Check if user already has a role
    if (user.roleId) {
      const currentRole = await Role.findById(user.roleId);
      if (currentRole) {
        console.log('✅ User already has role:', currentRole.roleName);
        process.exit(0);
      }
    }
    
    // Find or create Super Admin role
    console.log('\nLooking for Super Admin role...');
    let superAdminRole = await Role.findOne({ roleName: 'Super Admin' });
    
    if (!superAdminRole) {
      console.log('Creating Super Admin role...');
      superAdminRole = await Role.create({
        roleName: 'Super Admin',
        permissions: [
          {
            module: 'Hub',
            read: true,
            write: true,
            update: true,
            delete: true
          },
          {
            module: 'Role',
            read: true,
            write: true,
            update: true,
            delete: true
          },
          {
            module: 'Admin User',
            read: true,
            write: true,
            update: true,
            delete: true
          }
        ],
        status: true,
        isRoot: true
      });
      console.log('✅ Super Admin role created');
    } else {
      console.log('✅ Super Admin role found');
    }
    
    // Assign role to user
    console.log('\nAssigning role to user...');
    user.roleId = superAdminRole._id;
    await user.save();
    
    console.log('✅ Role assigned successfully!');
    console.log('\nUser details:');
    console.log('Email:', user.email);
    console.log('Role:', superAdminRole.roleName);
    console.log('Role ID:', superAdminRole._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
assignRole();
