import { Shipment } from '../../models/shipment/shipment.model';
import { Agency } from '../../models/admin/agency.model';
import { Wallet } from '../../models/wallet/wallet.model';
import { Transaction } from '../../models/wallet/transaction.model';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class AdminDashboardService {
  // Get admin dashboard statistics (aggregated across all franchises)
  async getAdminDashboard(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<ServiceResponse> {
    try {
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();
      let previousEndDate = new Date(now);

      // Calculate date ranges based on period
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          previousStartDate.setDate(now.getDate() - 1);
          previousStartDate.setHours(0, 0, 0, 0);
          previousEndDate.setDate(now.getDate() - 1);
          previousEndDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          previousStartDate.setDate(now.getDate() - 14);
          previousEndDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          previousStartDate.setDate(now.getDate() - 60);
          previousEndDate.setDate(now.getDate() - 30);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          previousStartDate.setFullYear(now.getFullYear() - 2);
          previousEndDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // 1. Overview Statistics
      const totalShipments = await Shipment.countDocuments();
      const activeShipments = await Shipment.countDocuments({
        status: { $in: ['in_transit', 'out_for_delivery'] },
      });

      const inTransitCount = await Shipment.countDocuments({ status: 'in_transit' });
      const outForDeliveryCount = await Shipment.countDocuments({ status: 'out_for_delivery' });

      // Shipments in current period
      const currentPeriodShipments = await Shipment.countDocuments({
        createdAt: { $gte: startDate, $lte: now },
      });

      // Shipments in previous period
      const previousPeriodShipments = await Shipment.countDocuments({
        createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      });

      // Calculate shipment percentage change
      const shipmentPercentageChange =
        previousPeriodShipments > 0
          ? (((currentPeriodShipments - previousPeriodShipments) / previousPeriodShipments) * 100).toFixed(1)
          : '0.0';

      // 2. Active Agencies Count
      const activeAgencies = await Agency.countDocuments({ status: 'Active' });

      // 3. Revenue Statistics
      const currentPeriodRevenue = await Transaction.aggregate([
        {
          $match: {
            type: 'debit',
            createdAt: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const previousPeriodRevenue = await Transaction.aggregate([
        {
          $match: {
            type: 'debit',
            createdAt: { $gte: previousStartDate, $lte: previousEndDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const currentRevenue = currentPeriodRevenue.length > 0 ? currentPeriodRevenue[0].total : 0;
      const previousRevenue = previousPeriodRevenue.length > 0 ? previousPeriodRevenue[0].total : 0;

      // Calculate revenue percentage change
      const revenuePercentageChange =
        previousRevenue > 0
          ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
          : '0.0';

      // 4. Revenue Trend (daily data for chart)
      const revenueTrend = await Transaction.aggregate([
        {
          $match: {
            type: 'debit',
            createdAt: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            revenue: 1,
          },
        },
      ]);

      // 5. Shipment Type Distribution
      const shipmentTypeDistribution = await Shipment.aggregate([
        {
          $group: {
            _id: '$shipmentType',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1,
          },
        },
      ]);

      // 6. Recent Bookings (last 10 shipments across all franchises)
      const recentBookingsData = await Shipment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Get franchise names for recent bookings
      const bookingUserIds = [...new Set(recentBookingsData.map(b => b.userId))];
      const bookingAgencies = await Agency.find({ _id: { $in: bookingUserIds } }, 'agencyName');
      const bookingAgencyMap = new Map(bookingAgencies.map(agency => [agency._id.toString(), agency.agencyName]));

      const recentBookings = recentBookingsData.map(booking => ({
        orderId: booking.orderId,
        waybill: booking.waybill || 'N/A',
        franchiseName: bookingAgencyMap.get(booking.userId) || 'Unknown',
        consigneeName: booking.name,
        amount: parseFloat(booking.totalAmount || booking.codAmount || '0'),
        status: booking.status,
        createdAt: booking.createdAt,
      }));

      return {
        success: true,
        data: {
          overview: {
            activeShipments: {
              total: activeShipments,
              inTransit: inTransitCount,
              outForDelivery: outForDeliveryCount,
            },
            totalShipments: {
              count: totalShipments,
              currentPeriod: currentPeriodShipments,
              percentageChange: shipmentPercentageChange,
            },
            revenue: {
              total: currentRevenue,
              percentageChange: revenuePercentageChange,
              currency: '₹',
            },
            activeAgencies: activeAgencies,
          },
          revenueTrend: revenueTrend,
          shipmentTypeDistribution: shipmentTypeDistribution,
          recentBookings: recentBookings,
          period: period,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching admin dashboard data',
      };
    }
  }

  // Get top performing franchises (per day)
  async getTopFranchises(limit: number = 3): Promise<ServiceResponse> {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const topFranchises = await Shipment.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $addFields: {
            numericAmount: {
              $toDouble: {
                $ifNull: ['$totalAmount', { $ifNull: ['$codAmount', '0'] }],
              },
            },
          },
        },
        {
          $group: {
            _id: '$userId',
            orderCount: { $sum: 1 },
            totalValue: { $sum: '$numericAmount' },
          },
        },
        {
          $sort: { totalValue: -1 },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'agencies',
            localField: '_id',
            foreignField: '_id',
            as: 'franchiseDetails',
          },
        },
        {
          $unwind: {
            path: '$franchiseDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            franchiseId: '$_id',
            franchiseName: { $ifNull: ['$franchiseDetails.agencyName', 'Unknown'] },
            orderCount: 1,
            totalValue: { $round: ['$totalValue', 2] },
          },
        },
      ]);

      return {
        success: true,
        data: topFranchises,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching top franchises',
      };
    }
  }

  // Get wallet statistics across all franchises
  async getWalletStatistics(): Promise<ServiceResponse> {
    try {
      const walletStats = await Wallet.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
            totalWallets: { $sum: 1 },
          },
        },
      ]);

      const totalCredits = await Transaction.aggregate([
        {
          $match: { type: 'credit' },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const totalDebits = await Transaction.aggregate([
        {
          $match: { type: 'debit' },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        success: true,
        data: {
          totalBalance: walletStats.length > 0 ? walletStats[0].totalBalance : 0,
          totalWallets: walletStats.length > 0 ? walletStats[0].totalWallets : 0,
          credits: {
            amount: totalCredits.length > 0 ? totalCredits[0].total : 0,
            count: totalCredits.length > 0 ? totalCredits[0].count : 0,
          },
          debits: {
            amount: totalDebits.length > 0 ? totalDebits[0].total : 0,
            count: totalDebits.length > 0 ? totalDebits[0].count : 0,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching wallet statistics',
      };
    }
  }
}
