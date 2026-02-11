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
            // Total Shipments
            const totalShipments = await shipment_model_1.Shipment.countDocuments({ userId });
            // Active Shipments (pending, created, in-transit)
            const activeShipments = await shipment_model_1.Shipment.countDocuments({
                userId,
                status: { $in: ['pending', 'created', 'in-transit'] },
            });
            // Today's Shipments
            const todaysShipments = await shipment_model_1.Shipment.countDocuments({
                userId,
                createdAt: { $gte: today, $lt: tomorrow },
            });
            // Wallet Balance
            const wallet = await wallet_model_1.Wallet.findOne({ userId });
            const walletBalance = wallet?.balance || 0;
            // COD Revenue (sum of all COD orders)
            const codOrders = await shipment_model_1.Shipment.find({
                userId,
                paymentMode: 'COD',
            }).lean();
            const codRevenue = codOrders.reduce((sum, order) => {
                return sum + parseFloat(order.codAmount || '0');
            }, 0);
            // Today's Revenue (sum of today's COD orders)
            const todaysCodOrders = await shipment_model_1.Shipment.find({
                userId,
                paymentMode: 'COD',
                createdAt: { $gte: today, $lt: tomorrow },
            }).lean();
            const todaysRevenue = todaysCodOrders.reduce((sum, order) => {
                return sum + parseFloat(order.codAmount || '0');
            }, 0);
            // Recent Bookings (last 5)
            const recentBookings = await shipment_model_1.Shipment.find({ userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
            const formattedBookings = recentBookings.map((booking) => ({
                bookingId: booking.waybill || booking.orderId,
                orderId: booking.orderId,
                franchise: booking.pickupLocation?.name || 'N/A',
                amount: booking.codAmount || booking.totalAmount || '0',
                status: booking.status,
                createdAt: booking.createdAt,
            }));
            // Shipment Type Distribution
            const roadFreight = await shipment_model_1.Shipment.countDocuments({
                userId,
                shippingMode: 'Surface',
            });
            const oceanFreight = 0; // Not implemented yet
            const airFreight = await shipment_model_1.Shipment.countDocuments({
                userId,
                shippingMode: 'Express',
            });
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
        }
        catch (error) {
            console.error('Dashboard service error:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch dashboard data',
            };
        }
    },
};
