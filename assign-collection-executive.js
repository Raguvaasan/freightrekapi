const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb+srv://freightrek_db_user:YUmKs8jxFygB12F7@cluster0.2c2cw2h.mongodb.net/freightrek');
  const db = mongoose.connection.db;
  const ObjectId = mongoose.Types.ObjectId;

  const result = await db.collection('staffs').updateOne(
    { _id: new ObjectId('69bfd0a0bd4b8230fe332815') },
    { $set: { roleId: new ObjectId('6961b5150eee7b5981e3c48d') } }
  );

  console.log('Update result:', JSON.stringify(result));

  const staff = await db.collection('staffs').findOne({ _id: new ObjectId('69bfd0a0bd4b8230fe332815') });
  console.log('Updated staff:', JSON.stringify({ _id: staff._id, name: staff.name, email: staff.email, roleId: staff.roleId }, null, 2));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
