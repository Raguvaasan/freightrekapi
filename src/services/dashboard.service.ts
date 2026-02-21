import { Shipment } from '../models/shipment/shipment.model';
import { Wallet } from '../models/wallet/wallet.model';
import { Transaction } from '../models/wallet/transaction.model';

export const dashboardService = {
  async getFranchiseDashboard(userId: string) {
    try {
      // Get current date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Run independent queries in parallel
      const [
        totalShipments,
        activeShipments,
        todaysShipments,
        wallet,
        codOrders,
        todaysCodOrders,
        recentBookings,
        roadFreight,
        airFreight
      ] = await Promise.all([
        Shipment.countDocuments({ userId }),
        Shipment.countDocuments({ userId, status: { $in: ['pending', 'created', 'in-transit'] } }),
        Shipment.countDocuments({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
        Wallet.findOne({ userId }).lean(),
        Shipment.find({ userId, paymentMode: 'COD' }).lean(),
        Shipment.find({ userId, paymentMode: 'COD', createdAt: { $gte: today, $lt: tomorrow } }).lean(),
        Shipment.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
        Shipment.countDocuments({ userId, shippingMode: 'Surface' }),
        Shipment.countDocuments({ userId, shippingMode: 'Express' })
      ]);

      const walletBalance = wallet?.balance || 0;
      const codRevenue = codOrders.reduce((sum, order) => sum + parseFloat(order.codAmount || '0'), 0);
      const todaysRevenue = todaysCodOrders.reduce((sum, order) => sum + parseFloat(order.codAmount || '0'), 0);

      const formattedBookings = recentBookings.map((booking:any) => ({
        bookingId: booking.waybill || booking.orderId,
        orderId: booking.order, // Use franchise API orderId
        franchise: booking.pickupLocation?.name || 'N/A',
        amount: booking.codAmount || booking.totalAmount || '0',
        status: booking.status,
        createdAt: booking.createdAt,
      }));

      // Shipment Type Distribution
      const oceanFreight = 0; // Not implemented yet
      const railFreight = 0; // Not implemented yet

      return {
        success: true,
        data: {
          overview: {
            activeShipments: {
              count: activeShipments,
              label: 'In Transit (S2) / Out for Delivery (S7)',
            },
            totalShipments: {
              count: totalShipments,
              label: '↑8.5% this week',
            },
            wallet: {
              amount: walletBalance,
              label: 'Today: ₹100',
            },
          },
          revenue: {
            codRevenue: {
              amount: codRevenue,
              label: '↑8.5% prev week',
            },
            todaysRevenue: {
              amount: todaysRevenue,
              label: '↑8.5% prev yesterday',
            },
            todaysShipments: {
              count: todaysShipments,
              label: '↑8.5% (vs Trnxd-19)',
            },
          },
          recentBookings: formattedBookings,
          shipmentType: {
            roadFreight,
            oceanFreight,
            airFreight,
            railFreight,
            total: totalShipments,
          },
        },
      };
    } catch (error: any) {
      console.error('Dashboard service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
      };
    }
  },
};
