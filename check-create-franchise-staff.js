// Create Franchise Staff Test Script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://freightrek_db_user:YUmKs8jxFygB12F7@cluster0.2c2cw2h.mongodb.net/freightrek';

// Define schemas
const staffSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  type: String,
  roleId: mongoose.Schema.Types.ObjectId,
  status: String,
  franchiseId: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String
}, { timestamps: true });

const agencySchema = new mongoose.Schema({
  agencyName: String
}, { strict: false });

async function checkAndCreateFranchiseStaff() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const Staff = mongoose.model('Staff', staffSchema);
    const Agency = mongoose.model('Agency', agencySchema);

    // 1. Check if any agencies exist
    console.log('=== CHECKING AGENCIES ===');
    const agencies = await Agency.find({}).select('_id agencyName').limit(5).lean();
    console.log(`Found ${agencies.length} agencies:`);
    agencies.forEach(a => console.log(`- ${a.agencyName} (${a._id})`));
    
    if (agencies.length === 0) {
      console.log('❌ No agencies found! Create an agency first.');
      process.exit(1);
    }

    const firstAgency = agencies[0];
    console.log(`\nUsing first agency: ${firstAgency.agencyName}\n`);

    // 2. Check existing staff
    console.log('=== CHECKING EXISTING STAFF ===');
    const allStaff = await Staff.find({}).select('username email type status franchiseId').lean();
    console.log(`Total staff: ${allStaff.length}`);
    
    const franchiseStaff = allStaff.filter(s => s.type === 'franchise');
    console.log(`Franchise staff: ${franchiseStaff.length}`);
    console.log(JSON.stringify(franchiseStaff, null, 2));

    // 3. Check if username exists
    const existingStaff = await Staff.findOne({ username: 'raguvasans46@gmail.com' }).lean();
    if (existingStaff) {
      console.log('\n=== EXISTING STAFF WITH THIS USERNAME ===');
      console.log(JSON.stringify(existingStaff, null, 2));
      
      if (existingStaff.type !== 'franchise') {
        console.log('\n⚠️  This user exists but is NOT a franchise staff!');
        console.log(`   Current type: ${existingStaff.type}`);
      }
      if (existingStaff.status !== 'Active') {
        console.log('\n⚠️  This user exists but status is NOT Active!');
        console.log(`   Current status: ${existingStaff.status}`);
      }
      if (!existingStaff.franchiseId) {
        console.log('\n⚠️  This user has NO franchiseId!');
      }
    } else {
      console.log('\n❌ No staff found with username: raguvasans46@gmail.com');
      console.log('\n=== CREATING FRANCHISE STAFF ===');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Create franchise staff
      const newStaff = await Staff.create({
        name: 'Raguvasans Franchise Staff',
        email: 'raguvasans46@gmail.com',
        phone: '1234567890',
        type: 'franchise',
        franchiseId: firstAgency._id,
        username: 'raguvasans46@gmail.com',
        password: hashedPassword,
        status: 'Active'
      });
      
      console.log('✅ Franchise staff created successfully:');
      console.log(JSON.stringify({
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        type: newStaff.type,
        username: newStaff.username,
        status: newStaff.status,
        franchiseId: newStaff.franchiseId
      }, null, 2));
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAndCreateFranchiseStaff();
