import { Types } from 'mongoose';
import { B2bInvoice } from '../../models/b2b/b2bInvoice.model';
import { B2bOrder } from '../../models/b2b/b2bOrder.model';
import { B2bUser } from '../../models/b2b/b2bUser.model';

const formatInvoiceNumber = (seq: number) => `B2B-INV-${String(seq).padStart(6, '0')}`;

export const b2bInvoiceService = {
  async getByOrder(orderId: string, userId?: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, code: 400, message: 'Invalid order ID' };

    const order = await B2bOrder.findOne({
      _id: orderId,
      ...(userId ? { b2bUserId: userId } : {}),
    }).populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status');
    if (!order) return { success: false, code: 404, message: 'B2B order not found' };
    const selectedVehicle = order.selectedVehicleId as any;
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
    const existing = await B2bInvoice.findOne({ order: order._id });
    if (existing) {
      existing.shipTo = order.deliveryCustomer;
      existing.deliveryAddress = order.deliveryCustomer.address;
      existing.driver = order.driver;
      existing.vehicle = vehicle;
      existing.orderStatus = order.status;
      await existing.save();
      return { success: true, data: existing };
    }

    const user = await B2bUser.findById(order.b2bUserId);
    if (!user) return { success: false, code: 404, message: 'B2B customer not found' };

    let seq = (await B2bInvoice.countDocuments()) + 1;
    let invoiceNumber = formatInvoiceNumber(seq);
    while (await B2bInvoice.exists({ invoiceNumber })) {
      invoiceNumber = formatInvoiceNumber(++seq);
    }

    try {
      const invoice = await B2bInvoice.create({
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
    } catch (error: any) {
      if (error?.code === 11000) {
        const invoice = await B2bInvoice.findOne({ order: order._id });
        if (invoice) return { success: true, data: invoice };
      }
      throw error;
    }
  },
};
