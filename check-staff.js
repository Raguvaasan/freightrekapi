const mongoose = require('mongoose');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/freightrek';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get Staff model
    const Staff = mongoose.model('Staff', new mongoose.Schema({
      username: String,
      email: String,
      type: String,
      status: String,
      franchiseId: mongoose.Schema.Types.ObjectId,
      roleId: mongoose.Schema.Types.ObjectId,
      password: String
    }, { strict: false }));
    
    // Find all staff
    console.log('\n=== ALL STAFF ===');
    const allStaff = await Staff.find({}).select('username email type status franchiseId roleId').lean();
    console.log(JSON.stringify(allStaff, null, 2));
    
    // Find franchise staff specifically
    console.log('\n=== FRANCHISE STAFF ===');
    const franchiseStaff = await Staff.find({ type: 'franchise' }).lean();
    console.log(JSON.stringify(franchiseStaff, null, 2));
    
    // Try to find by the username from the screenshot
    console.log('\n=== SEARCH BY USERNAME ===');
    const specificStaff = await Staff.findOne({ username: 'raguvasans46@gmail.com' }).lean();
    console.log(JSON.stringify(specificStaff, null, 2));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
