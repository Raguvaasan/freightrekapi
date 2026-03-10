const mongoose = require('mongoose');
// use compiled code from dist since script runs under node
const { Shipment } = require('../dist/src/models/shipment/shipment.model');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freightrek');

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 1);
    console.log('range', lastMonthStart, lastMonthEnd);

    const countAll = await Shipment.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } });
    console.log('all shipments in range:', countAll);

    const samples = await Shipment.find({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }).limit(5).lean();
    console.log('sample docs:', samples);

    const countByUser = await Shipment.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    console.log('counts by userId:', countByUser);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();