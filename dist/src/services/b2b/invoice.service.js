"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.b2bInvoiceService = void 0;
const mongoose_1 = require("mongoose");
const b2bInvoice_model_1 = require("../../models/b2b/b2bInvoice.model");
const b2bOrder_model_1 = require("../../models/b2b/b2bOrder.model");
const b2bUser_model_1 = require("../../models/b2b/b2bUser.model");
const formatInvoiceNumber = (seq) => `B2B-INV-${String(seq).padStart(6, '0')}`;
exports.b2bInvoiceService = {
    async getByOrder(orderId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, code: 400, message: 'Invalid order ID' };
        const order = await b2bOrder_model_1.B2bOrder.findOne({
            _id: orderId,
            ...(userId ? { b2bUserId: userId } : {}),
        }).populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status');
        if (!order)
            return { success: false, code: 404, message: 'B2B order not found' };
        const selectedVehicle = order.selectedVehicleId;
        const vehicle = selectedVehicle?.vehicleType
            ? {
                vehicleType: selectedVehicle.vehicleType,
                registrationNumber: selectedVehicle.vehicleRegistrationNumber,
                insuranceNumber: selectedVehicle.insuranceNumber,
                rcNumber: selectedVehicle.rcNumber,
                capacityKg: Number(String(selectedVehicle.capacity).replace(/[^0-9.]/g, '')),
                ratePerKm: order.ratePerKm,
                status: selectedVehicle.status,
            }
            : undefined;
        const existing = await b2bInvoice_model_1.B2bInvoice.findOne({ order: order._id });
        if (existing) {
            existing.shipTo = order.deliveryCustomer;
            existing.deliveryAddress = order.deliveryCustomer.address;
            existing.driver = order.driver;
            existing.vehicle = vehicle;
            existing.orderStatus = order.status;
            await existing.save();
            return { success: true, data: existing };
        }
        const user = await b2bUser_model_1.B2bUser.findById(order.b2bUserId);
        if (!user)
            return { success: false, code: 404, message: 'B2B customer not found' };
        let seq = (await b2bInvoice_model_1.B2bInvoice.countDocuments()) + 1;
        let invoiceNumber = formatInvoiceNumber(seq);
        while (await b2bInvoice_model_1.B2bInvoice.exists({ invoiceNumber })) {
            invoiceNumber = formatInvoiceNumber(++seq);
        }
        try {
            const invoice = await b2bInvoice_model_1.B2bInvoice.create({
                invoiceNumber,
                order: order._id,
                orderNumber: order.lrNo || order._id.toString(),
                b2bUserId: order.b2bUserId,
                invoiceDate: new Date(),
                billTo: {
                    name: user.name,
                    mobileNumber: user.mobileNumber,
                    address: user.address,
                    state: user.state,
                    pincode: user.pincode,
                    gstNumber: user.gstNumber,
                },
                shipTo: order.deliveryCustomer,
                pickupAddress: order.bookingCustomer.address,
                deliveryAddress: order.deliveryCustomer.address,
                lrNo: order.lrNo,
                waybill: order.waybill,
                orderStatus: order.status,
                shipment: order.shipment,
                driver: order.driver,
                vehicle,
                charges: {
                    transportationCharge: order.totalAmount || 0,
                    totalAmount: order.totalAmount || 0,
                },
                status: 'issued',
            });
            return { success: true, data: invoice };
        }
        catch (error) {
            if (error?.code === 11000) {
                const invoice = await b2bInvoice_model_1.B2bInvoice.findOne({ order: order._id });
                if (invoice)
                    return { success: true, data: invoice };
            }
            throw error;
        }
    },
};
