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

      // Get today's date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Run all independent queries in parallel for better performance
      const [
        totalShipments,
        activeShipments,
        inTransitCount,
        outForDeliveryCount,
        currentPeriodShipments,
        previousPeriodShipments,
        activeAgencies,
        allTimeRevenueData,
        todayRevenueData,
        currentPeriodRevenueData,
        previousPeriodRevenueData,
        revenueTrendData,
        shipmentTypeDistribution,
        ordersPerDay,
        todayOrders,
        recentBookingsData
      ] = await Promise.all([
        Shipment.countDocuments(),
        Shipment.countDocuments({ status: { $in: ['in_transit', 'out_for_delivery'] } }),
        Shipment.countDocuments({ status: 'in_transit' }),
        Shipment.countDocuments({ status: 'out_for_delivery' }),
        Shipment.countDocuments({ createdAt: { $gte: startDate, $lte: now } }),
        Shipment.countDocuments({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } }),
        Agency.countDocuments({ status: 'Active' }),
        Shipment.find().lean(),
        Shipment.find({ createdAt: { $gte: todayStart } }).lean(),
        Shipment.find({ createdAt: { $gte: startDate, $lte: now } }).lean(),
        Shipment.find({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } }).lean(),
        Shipment.find({ createdAt: { $gte: startDate, $lte: now } }).lean(),
        Shipment.aggregate([
          { $group: { _id: '$shippingMode', count: { $sum: 1 } } },
          { $project: { _id: 0, type: '$_id', count: 1 } },
        ]),
        Shipment.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: now } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
          {
            $project: {
              _id: 0,
              date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } },
              count: 1,
            },
          },
        ]),
        Shipment.countDocuments({ createdAt: { $gte: todayStart } }),
        Shipment.find().sort({ createdAt: -1 }).limit(10).lean(),
      ]);

      // Calculate shipment percentage change
      const shipmentPercentageChange =
        previousPeriodShipments > 0
          ? (((currentPeriodShipments - previousPeriodShipments) / previousPeriodShipments) * 100).toFixed(1)
          : '0.0';

      // Calculate all-time total revenue from all shipments
      const totalRevenue = allTimeRevenueData.reduce((sum, shipment) => {
        return sum + parseFloat(shipment.totalAmount || shipment.codAmount || '0');
      }, 0);

      // Calculate today's revenue
      const todayRevenue = todayRevenueData.reduce((sum, shipment) => {
        return sum + parseFloat(shipment.totalAmount || shipment.codAmount || '0');
      }, 0);

      // Calculate revenue from shipments for current period (for trend analysis)
      const currentRevenue = currentPeriodRevenueData.reduce((sum, shipment) => {
        return sum + parseFloat(shipment.totalAmount || shipment.codAmount || '0');
      }, 0);

      const previousRevenue = previousPeriodRevenueData.reduce((sum, shipment) => {
        return sum + parseFloat(shipment.totalAmount || shipment.codAmount || '0');
      }, 0);

      const revenuePercentageChange =
        previousRevenue > 0
          ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
          : '0.0';

      // Create revenue trend (group by day)
      const revenueTrendMap = new Map();
      revenueTrendData.forEach((shipment) => {
        const date = new Date(shipment.createdAt);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        const amount = parseFloat(shipment.totalAmount || shipment.codAmount || '0');
        revenueTrendMap.set(dateKey, (revenueTrendMap.get(dateKey) || 0) + amount);
      });

      const revenueTrend = Array.from(revenueTrendMap.entries())
        .map(([date, revenue]) => ({ date: new Date(date), revenue }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate average orders per day for current period
      const totalDaysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const averageOrdersPerDay = (currentPeriodShipments / totalDaysInPeriod).toFixed(2);

      // Normalize shipment type distribution to always show both Surface and Express with percentages
      const shipmentTypeMap = new Map(shipmentTypeDistribution.map(item => [item.type, item.count]));
      const surfaceCount = shipmentTypeMap.get('Surface') || 0;
      const expressCount = shipmentTypeMap.get('Express') || 0;
      const totalShipmentTypeCount = surfaceCount + expressCount || 1; // Avoid division by zero
      
      const normalizedShipmentTypes = [
        { 
          type: 'Surface', 
          count: surfaceCount,
          percentage: ((surfaceCount / totalShipmentTypeCount) * 100).toFixed(1)
        },
        { 
          type: 'Express', 
          count: expressCount,
          percentage: ((expressCount / totalShipmentTypeCount) * 100).toFixed(1)
        },
      ];

      // Get franchise names for recent bookings
      const bookingUserIds = [...new Set(recentBookingsData.map(b => b.userId))];
      const bookingAgencies = await Agency.find({ _id: { $in: bookingUserIds } }, 'agencyName');
      const bookingAgencyMap = new Map(bookingAgencies.map(agency => [agency._id.toString(), agency.agencyName]));
console.log('Recent Bookings Data:', recentBookingsData);
      const recentBookings = recentBookingsData.map(booking => ({
        orderId: booking.order, // Use franchise API orderId
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
            totalOrders: {
              allTime: totalShipments,
              today: todayOrders,
              currentPeriod: currentPeriodShipments,
              averagePerDay: parseFloat(averageOrdersPerDay),
            },
            revenue: {
              total: totalRevenue,
              today: todayRevenue,
              percentageChange: revenuePercentageChange,
              currency: '₹',
            },
            activeAgencies: activeAgencies,
          },
          revenueTrend: revenueTrend,
          ordersPerDay: ordersPerDay,
          shipmentTypeDistribution: normalizedShipmentTypes,
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

  // Get top performing franchises
  async getTopFranchises(limit: number = 3, period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<ServiceResponse> {
    try {
      // Calculate date range based on period
      let matchStage: any = {};
      
      if (period !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        matchStage = {
          $match: {
            createdAt: { $gte: startDate },
          },
        };
      }

      const pipeline: any[] = [];
      
      // Only add match stage if period is not 'all'
      if (period !== 'all') {
        pipeline.push(matchStage);
      }
      
      pipeline.push(
        {
          $addFields: {
            numericAmount: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$totalAmount', ''] },
                    { $ne: ['$totalAmount', null] },
                  ],
                },
                then: {
                  $convert: {
                    input: '$totalAmount',
                    to: 'double',
                    onError: 0,
                    onNull: 0,
                  },
                },
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ['$codAmount', ''] },
                        { $ne: ['$codAmount', null] },
                      ],
                    },
                    then: {
                      $convert: {
                        input: '$codAmount',
                        to: 'double',
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    else: 0,
                  },
                },
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
          $addFields: {
            userObjectId: { $toObjectId: '$_id' },
          },
        },
        {
          $lookup: {
            from: 'agencies',
            localField: 'userObjectId',
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
        }
      );
      
      const topFranchises = await Shipment.aggregate(pipeline);

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

  // Get simple orders statistics - total count and per day breakdown
  async getOrdersStatistics(): Promise<ServiceResponse> {
    try {
      // 1. Total orders (all time)
      const totalOrders = await Shipment.countDocuments();

      // 2. Today's orders
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayOrders = await Shipment.countDocuments({
        createdAt: { $gte: todayStart },
      });

      // 3. Orders per day (all time)
      const ordersPerDay = await Shipment.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
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
            count: 1,
          },
        },
      ]);

      // 4. Calculate average orders per day
      const firstOrder = await Shipment.findOne().sort({ createdAt: 1 }).select('createdAt');
      let averagePerDay = 0;
      
      if (firstOrder && firstOrder.createdAt) {
        const daysSinceFirst = Math.ceil(
          (new Date().getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ) || 1;
        averagePerDay = parseFloat((totalOrders / daysSinceFirst).toFixed(2));
      }

      return {
        success: true,
        data: {
          totalOrders,
          todayOrders,
          averagePerDay,
          ordersPerDay,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching orders statistics',
      };
    }
  }

  // Get franchise-wise report data for dashboard/report page
  async getFranchiseReport(period: 'day' | 'week' | 'month' | 'year' = 'month', isPreviousPeriod: boolean = false): Promise<ServiceResponse> {
    try {
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();
      let previousEndDate = new Date(now);
      let compareStartDate = new Date();
      let compareEndDate = new Date(now);

      // determine date windows based on period
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          previousStartDate.setDate(now.getDate() - 1);
          previousStartDate.setHours(0, 0, 0, 0);
          previousEndDate.setDate(now.getDate() - 1);
          previousEndDate.setHours(23, 59, 59, 999);
          compareStartDate.setDate(now.getDate() - 2);
          compareStartDate.setHours(0, 0, 0, 0);
          compareEndDate.setDate(now.getDate() - 2);
          compareEndDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          previousStartDate.setDate(now.getDate() - 14);
          previousEndDate.setDate(now.getDate() - 7);
          compareStartDate.setDate(now.getDate() - 21);
          compareEndDate.setDate(now.getDate() - 14);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          previousStartDate.setDate(now.getDate() - 60);
          previousEndDate.setDate(now.getDate() - 30);
          compareStartDate.setDate(now.getDate() - 90);
          compareEndDate.setDate(now.getDate() - 60);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          previousStartDate.setFullYear(now.getFullYear() - 2);
          previousEndDate.setFullYear(now.getFullYear() - 1);
          compareStartDate.setFullYear(now.getFullYear() - 3);
          compareEndDate.setFullYear(now.getFullYear() - 2);
          break;
      }

      // Use previous period dates if isPreviousPeriod is true
      const queryStartDate = isPreviousPeriod ? previousStartDate : startDate;
      const queryEndDate = isPreviousPeriod ? previousEndDate : now;
      const compareStart = isPreviousPeriod ? compareStartDate : previousStartDate;
      const compareEnd = isPreviousPeriod ? compareEndDate : previousEndDate;

      // overall counts for overview cards
      const [totalFranchises, currentPeriodShipments, deliveredCount, revenueShipments] =
        await Promise.all([
          Agency.countDocuments({ status: 'Active' }),
          Shipment.countDocuments({ createdAt: { $gte: queryStartDate, $lte: queryEndDate } }),
          Shipment.countDocuments({
            createdAt: { $gte: queryStartDate, $lte: queryEndDate },
            status: 'delivered',
          }),
          Shipment.find({ createdAt: { $gte: queryStartDate, $lte: queryEndDate } }).lean(),
        ]);

      const totalRevenue = revenueShipments.reduce((sum, s) => {
        return sum + parseFloat(s.totalAmount || s.codAmount || '0');
      }, 0);

      // aggregation per franchise for current/previous period
      const currentPipeline: any[] = [
        {
          $match: { createdAt: { $gte: queryStartDate, $lte: queryEndDate } },
        },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            delivered: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
            rto: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rto'] }, 1, 0],
              },
            },
            revenue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$totalAmount', null] },
                      { $eq: ['$totalAmount', ''] },
                      { $eq: ['$codAmount', null] },
                      { $eq: ['$codAmount', ''] },
                    ],
                  },
                  0,
                  {
                    $convert: {
                      input: { $ifNull: ['$totalAmount', '$codAmount'] },
                      to: 'double',
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      ];

      const previousPipeline: any[] = [
        {
          $match: {
            createdAt: { $gte: compareStart, $lte: compareEnd },
          },
        },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
          },
        },
      ];

      const [currentAgg, previousAgg] = await Promise.all([
        Shipment.aggregate(currentPipeline),
        Shipment.aggregate(previousPipeline),
      ]);

      const prevMap = new Map<string, number>();
      previousAgg.forEach((item: any) => {
        prevMap.set(item._id?.toString() || '', item.totalOrders);
      });

      // fetch franchise names
      const franchiseIds = currentAgg.map((i: any) => i._id).filter(Boolean);
      const agencies = await Agency.find({ _id: { $in: franchiseIds } }, 'agencyName');
      const agencyMap = new Map(agencies.map(a => [a._id.toString(), a.agencyName]));

      const franchisePerformance = currentAgg.map((item: any) => {
        const prevCount = prevMap.get(item._id?.toString() || '') || 0;
        const growth =
          prevCount > 0
            ? (((item.totalOrders - prevCount) / prevCount) * 100).toFixed(1)
            : '0.0';
        return {
          franchiseId: item._id,
          franchiseName: agencyMap.get(item._id.toString()) || 'Unknown',
          totalOrders: item.totalOrders,
          delivered: item.delivered,
          pending: item.pending,
          rto: item.rto,
          revenue: item.revenue,
          growth: growth,
        };
      });

      const displayPeriod = isPreviousPeriod ? `previous_${period}` : period;

      return {
        success: true,
        data: {
          overview: {
            totalFranchises,
            totalOrders: currentPeriodShipments,
            delivered: deliveredCount,
            revenue: totalRevenue,
            period: displayPeriod,
          },
          franchisePerformance,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching franchise report',
      };
    }
  }
}

