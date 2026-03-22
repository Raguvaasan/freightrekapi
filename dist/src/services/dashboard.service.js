"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const shipment_model_1 = require("../models/shipment/shipment.model");
const wallet_model_1 = require("../models/wallet/wallet.model");
exports.dashboardService = {
    async getFranchiseDashboard(userId) {
        try {
            // Get current date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Run independent queries in parallel
            const [totalShipments, activeShipments, todaysShipments, wallet, codOrders, todaysCodOrders, recentBookings, surfaceCount, expressCount] = await Promise.all([
                shipment_model_1.Shipment.countDocuments({ userId }),
                shipment_model_1.Shipment.countDocuments({ userId, status: { $in: ['pending', 'created', 'in-transit'] } }),
                shipment_model_1.Shipment.countDocuments({ userId, createdAt: { $gte: today, $lt: tomorrow } }),
                wallet_model_1.Wallet.findOne({ userId }).lean(),
                shipment_model_1.Shipment.find({ userId, paymentMode: 'COD' }).lean(),
                shipment_model_1.Shipment.find({ userId, paymentMode: 'COD', createdAt: { $gte: today, $lt: tomorrow } }).lean(),
                shipment_model_1.Shipment.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
                shipment_model_1.Shipment.countDocuments({ userId, shippingMode: 'Surface' }),
                shipment_model_1.Shipment.countDocuments({ userId, shippingMode: 'Express' })
            ]);
            const walletBalance = wallet?.balance || 0;
            const codRevenue = codOrders.reduce((sum, order) => sum + parseFloat(order.codAmount || '0'), 0);
            const todaysRevenue = todaysCodOrders.reduce((sum, order) => sum + parseFloat(order.codAmount || '0'), 0);
            const formattedBookings = recentBookings.map((booking) => ({
                bookingId: booking.waybill || booking.orderId,
                orderId: booking.order, // Use franchise API orderId
                franchise: booking.pickupLocation?.name || 'N/A',
                amount: booking.paymentMode == 'COD'
                    ? (booking.codAmount || '0')
                    : (booking.totalAmount || booking.codAmount || '0'),
                status: booking.status,
                date: booking.createdAt, // Booking date
                dropLocation: booking.city && booking.state ? `${booking.city}, ${booking.state}` : booking.city || 'N/A', // Drop location
                createdAt: booking.createdAt,
            }));
            // Shipment Type Distribution (matching admin dashboard format)
            const totalShipmentTypeCount = surfaceCount + expressCount || 1; // Avoid division by zero
            const shipmentTypeDistribution = [
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
                    shipmentTypeDistribution: shipmentTypeDistribution,
                },
            };
        }
        catch (error) {
            console.error('Dashboard service error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch dashboard data',
            };
        }
    },
    async getOrdersReport(userId, period = 'thisMonth', startDate, endDate, role) {
        try {
            // Normalize period string to avoid case mismatches from the client
            const p = period ? period.toString().toLowerCase() : 'thismonth';
            // Determine date range based on period
            let dateFilter = {};
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (p === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateFilter = { $gte: today, $lt: tomorrow };
            }
            else if (p === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const tomorrowPrev = new Date(yesterday);
                tomorrowPrev.setDate(tomorrowPrev.getDate() + 1);
                dateFilter = { $gte: yesterday, $lt: tomorrowPrev };
            }
            else if (p === 'thisweek') {
                const dayOfWeek = today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - dayOfWeek);
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);
                dateFilter = { $gte: startOfWeek, $lt: endOfWeek };
            }
            else if (p === 'lastmonth') {
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
                dateFilter = { $gte: lastMonthStart, $lt: lastMonthEnd };
            }
            else if (p === 'customrange' && startDate && endDate) {
                dateFilter = {
                    $gte: new Date(startDate),
                    $lt: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)),
                };
            }
            else {
                // Default: This Month
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                dateFilter = { $gte: monthStart, $lt: monthEnd };
            }
            // Build base query; admins should see everything
            const baseQuery = { createdAt: dateFilter };
            if (!role || role.toLowerCase() !== 'admin') {
                baseQuery.userId = userId;
            }
            // Get counts by status
            const [totalOrders, deliveredOrders, inTransitOrders, pendingOrders, rtoOrders, allOrders] = await Promise.all([
                shipment_model_1.Shipment.countDocuments(baseQuery),
                shipment_model_1.Shipment.countDocuments({ ...baseQuery, status: 'delivered' }),
                shipment_model_1.Shipment.countDocuments({ ...baseQuery, status: 'in_transit' }),
                shipment_model_1.Shipment.countDocuments({ ...baseQuery, status: 'pending' }),
                shipment_model_1.Shipment.countDocuments({ ...baseQuery, status: 'failed' }), // RTO = failed
                shipment_model_1.Shipment.find(baseQuery)
                    .select('createdAt status')
                    .lean()
            ]);
            // Calculate percentages
            const totalCount = totalOrders || 1;
            const deliveredPercentage = ((deliveredOrders / totalCount) * 100).toFixed(1);
            const inTransitPercentage = ((inTransitOrders / totalCount) * 100).toFixed(1);
            const pendingPercentage = ((pendingOrders / totalCount) * 100).toFixed(1);
            const rtoPercentage = ((rtoOrders / totalCount) * 100).toFixed(1);
            // Calculate success rate
            const successRate = ((deliveredOrders / totalCount) * 100).toFixed(1);
            // Generate daily trend data based on the dateFilter range.
            // This ensures the trend reflects the requested period (e.g. last month vs this month)
            const dailyTrend = {};
            // determine start/end from the filter
            const startDateObj = new Date(dateFilter.$gte);
            const endDateObj = new Date(dateFilter.$lt);
            // make endDate inclusive (subtract one day)
            endDateObj.setHours(0, 0, 0, 0);
            endDateObj.setDate(endDateObj.getDate() - 1);
            const iter = new Date(startDateObj);
            while (iter <= endDateObj) {
                const dateStr = iter.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dailyTrend[dateStr] = 0;
                iter.setDate(iter.getDate() + 1);
            }
            // Count orders by date
            allOrders.forEach((order) => {
                const orderDate = new Date(order.createdAt);
                orderDate.setHours(0, 0, 0, 0);
                const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (dailyTrend[dateStr] !== undefined) {
                    dailyTrend[dateStr]++;
                }
            });
            return {
                success: true,
                data: {
                    summary: {
                        totalOrders,
                        period: period || 'thisMonth',
                    },
                    statusBreakdown: {
                        delivered: {
                            count: deliveredOrders,
                            percentage: parseFloat(deliveredPercentage),
                        },
                        inTransit: {
                            count: inTransitOrders,
                            percentage: parseFloat(inTransitPercentage),
                        },
                        pending: {
                            count: pendingOrders,
                            percentage: parseFloat(pendingPercentage),
                        },
                        rto: {
                            count: rtoOrders,
                            percentage: parseFloat(rtoPercentage),
                        },
                    },
                    successRate: parseFloat(successRate),
                    dailyTrend: dailyTrend,
                },
            };
        }
        catch (error) {
            console.error('Orders report service error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch orders report',
            };
        }
    },
};
