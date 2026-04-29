import { Shipment } from '../../models/shipment/shipment.model';
import { Agency } from '../../models/admin/agency.model';
import { Wallet } from '../../models/wallet/wallet.model';
import { Transaction } from '../../models/wallet/transaction.model';
import { HubModel } from '../../models/hub/hub.model';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class AdminDashboardService {
  // Internal helper to compute a Mongo date filter from a period string
  private getDateFilter(period: string, startDate?: string, endDate?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const p = period ? period.toString().toLowerCase() : 'thismonth';
    let range: { $gte: Date; $lt: Date };

    switch (p) {
      case 'today': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        range = { $gte: today, $lt: tomorrow };
        break;
      }
      case 'thisweek': {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        range = { $gte: startOfWeek, $lt: endOfWeek };
        break;
      }
      case 'thismonth': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        range = { $gte: monthStart, $lt: monthEnd };
        break;
      }
      case 'lastmonth': {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
        range = { $gte: lastMonthStart, $lt: lastMonthEnd };
        break;
      }
      case 'thisquarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(today.getFullYear(), quarter * 3 + 3, 1);
        range = { $gte: quarterStart, $lt: quarterEnd };
        break;
      }
      case 'thisyear': {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
        range = { $gte: yearStart, $lt: yearEnd };
        break;
      }
      case 'customrange':
        if (startDate && endDate) {
          const s = new Date(startDate);
          const e = new Date(endDate);
          e.setDate(e.getDate() + 1);
          range = { $gte: s, $lt: e };
          break;
        }
        // fallthrough to default if dates missing
      default: {
        // default to this month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        range = { $gte: monthStart, $lt: monthEnd };
      }
    }

    return range;
  }

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
        totalHubs,
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
        HubModel.countDocuments({ status: true }),
        Shipment.find({ status: { $nin: ['cancelled', 'failed'] } }).lean(),
        Shipment.find({ status: { $nin: ['cancelled', 'failed'] }, createdAt: { $gte: todayStart } }).lean(),
        Shipment.find({ status: { $nin: ['cancelled', 'failed'] }, createdAt: { $gte: startDate, $lte: now } }).lean(),
        Shipment.find({ status: { $nin: ['cancelled', 'failed'] }, createdAt: { $gte: previousStartDate, $lte: previousEndDate } }).lean(),
        Shipment.find({ status: { $nin: ['cancelled', 'failed'] }, createdAt: { $gte: startDate, $lte: now } }).lean(),
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

      // Calculate all-time revenue breakdown from per-shipment stored values
      let delhiveryCost = 0;
      let markupProfit = 0;

      allTimeRevenueData.forEach((shipment) => {
        const shipmentTotal = parseFloat(shipment.totalAmount || shipment.codAmount || '0');

        if (shipment.baseAmount != null) {
          delhiveryCost += shipment.baseAmount;
        } else {
          delhiveryCost += shipmentTotal;
        }

        if (shipment.baseAmount != null && shipment.markupAmount != null) {
          markupProfit += (shipment.markupAmount - shipment.baseAmount);
        }
      });

      // Round to 2 decimal places
      delhiveryCost = parseFloat(delhiveryCost.toFixed(2));
      markupProfit = parseFloat(markupProfit.toFixed(2));
      const totalRevenue = parseFloat((delhiveryCost + markupProfit).toFixed(2));

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
              delhiveryCost: delhiveryCost,
              markupProfit: markupProfit,
              today: todayRevenue,
              percentageChange: revenuePercentageChange,
              currency: '₹',
            },
            activeAgencies: activeAgencies,
            totalHubs: totalHubs,
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

  // Generate revenue report used by the Total Revenue page
  async getTotalRevenueReport(period: string = 'thisMonth', startDate?: string, endDate?: string): Promise<ServiceResponse> {
    try {
      const dateFilter = this.getDateFilter(period, startDate, endDate);
      const shipments = await Shipment.find({ status: { $nin: ['cancelled', 'failed'] }, createdAt: dateFilter }).lean();

      const totalRevenue = shipments.reduce((sum, s) => {
        return sum + parseFloat(s.totalAmount || s.codAmount || '0');
      }, 0);

      const shippingCharges = shipments.reduce((sum, s) => {
        // assume prepaid totalAmount represents shipping charge
        return sum + (s.paymentMode === 'Prepaid' ? parseFloat(s.totalAmount || '0') : 0);
      }, 0);

      const codCharges = shipments.reduce((sum, s) => {
        return sum + (s.paymentMode === 'COD' ? parseFloat(s.codAmount || '0') : 0);
      }, 0);

      const otherCharges = totalRevenue - shippingCharges - codCharges;

      // Build revenue trend grouping by day or month depending on range length
      const trendMap = new Map<string, number>();
      // decide whether to group monthly (more than 60 days)
      const start = new Date(dateFilter.$gte);
      const end = new Date(dateFilter.$lt);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 60) {
        // monthly buckets
        let d = new Date(start.getFullYear(), start.getMonth(), 1);
        while (d < end) {
          const key = d.toLocaleDateString('en-US', { month: 'short' });
          trendMap.set(key, 0);
          d.setMonth(d.getMonth() + 1);
        }
        shipments.forEach(s => {
          const d = new Date(s.createdAt);
          const key = d.toLocaleDateString('en-US', { month: 'short' });
          if (trendMap.has(key)) {
            trendMap.set(key, trendMap.get(key)! + parseFloat(s.totalAmount || s.codAmount || '0'));
          }
        });
      } else {
        // daily buckets
        let d = new Date(start);
        while (d < end) {
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          trendMap.set(key, 0);
          d.setDate(d.getDate() + 1);
        }
        shipments.forEach(s => {
          const d = new Date(s.createdAt);
          d.setHours(0, 0, 0, 0);
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (trendMap.has(key)) {
            trendMap.set(key, trendMap.get(key)! + parseFloat(s.totalAmount || s.codAmount || '0'));
          }
        });
      }

      const revenueTrend = Array.from(trendMap.entries()).map(([date, revenue]) => ({ date, revenue }));

      // compute percentages
      const pct = (val: number) => totalRevenue ? parseFloat(((val / totalRevenue) * 100).toFixed(1)) : 0;

      const paymentSplit = [
        { method: 'Prepaid', amount: shippingCharges, percentage: pct(shippingCharges) },
        { method: 'COD', amount: codCharges, percentage: pct(codCharges) },
      ];

      const revenueBySource = [
        { source: 'Shipping', amount: shippingCharges, percentage: pct(shippingCharges) },
        { source: 'COD', amount: codCharges, percentage: pct(codCharges) },
        { source: 'Other', amount: otherCharges, percentage: pct(otherCharges) },
      ];

      return {
        success: true,
        data: {
          overview: {
            totalRevenue,
            shippingCharges,
            codCharges,
            otherCharges,
          },
          revenueTrend,
          revenueBySource,
          paymentMethodSplit: paymentSplit,
          period,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error generating revenue report',
      };
    }
  }

  // delivery performance metrics (stubbed for now)
  async getDeliveryPerformance(period: string = 'thisMonth', startDate?: string, endDate?: string): Promise<ServiceResponse> {
    try {
      const dateFilter = this.getDateFilter(period, startDate, endDate);
      const totalDelivered = await Shipment.countDocuments({ status: 'delivered', createdAt: dateFilter });

      return {
        success: true,
        data: {
          overview: {
            onTimePercentage: 0,
            avgTimeDays: 0,
            firstAttemptPercentage: 0,
            csatScore: 0,
            totalDelivered,
            slaMetPercentage: 0,
          },
          zonePerformance: [],
          deliveryAttemptAnalysis: {
            firstAttempt: 0,
            secondAttempt: 0,
            thirdPlus: 0,
          },
          deliveryTimeDistribution: {
            within1day: 0,
            '1-2days': 0,
            '2-3days': 0,
            '3+days': 0,
          },
          period,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error generating delivery performance',
      };
    }
  }

  // Get top performing franchises
  async getTopFranchises(limit: number = 3, period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<ServiceResponse> {
    try {
      // Get all franchise (agency) IDs
      const agencies = await Agency.find({ status: 'Active' }, '_id agencyName').lean();
      const franchiseIds = agencies.map((a: any) => a._id.toString());
      const franchiseNameMap = new Map(agencies.map((a: any) => [a._id.toString(), a.agencyName]));

      // Build date filter for period
      let dateFilter: any = {};
      if (period !== 'all') {
        const now = new Date();
        const startDate = new Date();
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
        dateFilter = { createdAt: { $gte: startDate } };
      }

      // Rank franchises by actual order count and total revenue from shipments
      const shipmentPipeline: any[] = [
        {
          $match: {
            userId: { $in: franchiseIds },
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: '$userId',
            orderCount: { $sum: 1 },
            totalValue: { $sum: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
          },
        },
        { $sort: { orderCount: -1, totalValue: -1 } },
        { $limit: limit },
      ];

      const txnData = await Shipment.aggregate(shipmentPipeline);

      // Fill in any franchises that have no transactions with zeros
      // so that all active franchises appear if fewer than `limit` have transactions
      const resultMap = new Map(txnData.map((t: any) => [t._id, t]));
      let results: any[] = txnData.map((t: any) => ({
        franchiseId: t._id,
        franchiseName: franchiseNameMap.get(t._id) || 'Unknown',
        orderCount: t.orderCount,
        totalValue: parseFloat(t.totalValue.toFixed(2)),
      }));

      // If fewer results than limit, pad with other active franchises (value 0)
      if (results.length < limit) {
        for (const agency of agencies) {
          if (results.length >= limit) break;
          const id = agency._id.toString();
          if (!resultMap.has(id)) {
            results.push({
              franchiseId: id,
              franchiseName: (agency as any).agencyName,
              orderCount: 0,
              totalValue: 0,
            });
          }
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching top franchises',
      };
    }
  }

  // Get wallet statistics across all franchises only
  async getWalletStatistics(): Promise<ServiceResponse> {
    try {
      // Only consider franchise (Agency) wallets and transactions
      const agencies = await Agency.find({}, '_id');
      const franchiseIds = agencies.map(a => a._id.toString());

      const walletStats = await Wallet.aggregate([
        {
          $match: { userId: { $in: franchiseIds } },
        },
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
          $match: { type: 'credit', userId: { $in: franchiseIds } },
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
          $match: { type: 'debit', userId: { $in: franchiseIds } },
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

