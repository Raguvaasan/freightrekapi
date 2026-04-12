require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const ids = [
    'ORD_69bcb402851dc0a2386f11f6_1775759508182',
    'ORD_69bcb402851dc0a2386f11f6_1775758334336',
    'ORD_69bcb402851dc0a2386f11f6_1775753764928'
  ];
  const orders = await db.collection('shipments').find(
    { orderId: { $in: ids } },
    { projection: { orderId:1, fromName:1, fromAdd:1, fromCity:1, fromState:1, fromPin:1, fromPhone:1 } }
  ).toArray();
  console.log(JSON.stringify(orders, null, 2));
  mongoose.disconnect();
});
