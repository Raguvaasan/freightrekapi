import { Shipment } from '../../models/shipment/shipment.model';

// Match all shipments belonging to or assigned to this hub
const hubFilter = (hubId: string) => ({ $or: [{ userId: hubId }, { assignedHubId: hubId }] });

type Period = 'week' | 'thisMonth' | 'lastMonth' | 'month';

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  if (period === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (period === 'thisMonth') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'lastMonth') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // default: thisMonth
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

export const hubDashboardService = {
  async getDashboard(hubId: string, period: Period = 'thisMonth') {
    try {
      const { start, end } = getPeriodRange(period);
      const periodFilter = { createdAt: { $gte: start, $lte: end } };

      // Total & active shipments for this hub within period
      const [totalShipments, activeShipments] = await Promise.all([
        Shipment.countDocuments({ ...hubFilter(hubId), ...periodFilter }),
        Shipment.countDocuments({ ...hubFilter(hubId), ...periodFilter, status: { $in: ['Active', 'in_transit'] } }),
      ]);

      // Revenue: sum of totalAmount for period
      const revenueAgg = await Shipment.aggregate([
        { $match: { ...hubFilter(hubId), ...periodFilter, status: { $nin: ['cancelled', 'failed'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: { $ifNull: ['$totalAmount', '0'] } } },
            codTotal: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentMode', 'COD'] },
                  { $toDouble: { $ifNull: ['$totalAmount', '0'] } },
                  0,
                ],
              },
            },
            shipmentCount: { $sum: 1 },
          },
        },
      ]);

      const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
      const codRevenue = revenueAgg.length > 0 ? revenueAgg[0].codTotal : 0;
      const shipmentCount = revenueAgg.length > 0 ? revenueAgg[0].shipmentCount : 0;

      // Revenue chart breakdown by day (within period)
      const weeklyAgg = await Shipment.aggregate([
        {
          $match: {
            ...hubFilter(hubId),
            ...periodFilter,
            status: { $nin: ['cancelled', 'failed'] },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' }, // 1=Sun, 2=Mon, ..., 7=Sat
            revenue: { $sum: { $toDouble: { $ifNull: ['$totalAmount', '0'] } } },
          },
        },
      ]);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyRevenue = days.map((day, idx) => {
        const found = weeklyAgg.find(w => w._id === idx + 1);
        return { day, revenue: found ? found.revenue : 0 };
      });

      // Shipment type breakdown (Surface / Express) within period
      const shipmentTypeAgg = await Shipment.aggregate([
        { $match: { ...hubFilter(hubId), ...periodFilter, status: { $nin: ['cancelled', 'failed'] } } },
        { $group: { _id: '$shippingMode', count: { $sum: 1 } } },
      ]);

      const total = shipmentTypeAgg.reduce((sum, s) => sum + s.count, 0);
      const shipmentType = shipmentTypeAgg.map(s => ({
        mode: s._id || 'Surface',
        count: s.count,
        percentage: total > 0 ? parseFloat(((s.count / total) * 100).toFixed(1)) : 0,
      }));

      // Recent bookings (latest 10) within period
      const recentBookings = await Shipment.find({ ...hubFilter(hubId), ...periodFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderId totalAmount createdAt status waybill')
        .lean();

      return {
        success: true,
        data: {
          overview: {
            activeShipments,
            totalShipments,
          },
          period,
          revenue: {
            total: revenue,
            cod: codRevenue,
            shipments: shipmentCount,
            weekly: weeklyRevenue,
          },
          shipmentType,
          recentBookings: recentBookings.map(b => ({
            orderId: b.orderId,
            waybill: b.waybill,
            amount: b.totalAmount,
            date: b.createdAt,
            status: b.status,
          })),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch hub dashboard',
      };
    }
  },
};
