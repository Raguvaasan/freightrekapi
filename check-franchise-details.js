const mongoose = require('mongoose');
require('dotenv').config();

const agencySchema = new mongoose.Schema({
  agencyName: String,
  agencyOwner: String,
  phone: String,
  status: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
}, { timestamps: true });

const Agency = mongoose.model('Agency', agencySchema);

async function checkFranchiseDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const franchise = await Agency.findOne({ agencyName: 'HEYDELIVER FRANCHISE' });
    
    if (franchise) {
      console.log('\n📦 Franchise Details:');
      console.log('Name:', franchise.agencyName);
      console.log('Owner:', franchise.agencyOwner);
      console.log('Phone:', franchise.phone);
      console.log('Address:', franchise.address || '❌ NOT SET');
      console.log('City:', franchise.city || '❌ NOT SET');
      console.log('State:', franchise.state || '❌ NOT SET');
      console.log('Pincode:', franchise.pincode || '❌ NOT SET');
      console.log('Status:', franchise.status);
    } else {
      console.log('❌ Franchise not found with name: HEYDELIVER FRANCHISE');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkFranchiseDetails();
