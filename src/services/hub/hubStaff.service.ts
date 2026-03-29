import { Staff } from '../../models/admin/staff.model';
import { Shipment } from '../../models/shipment/shipment.model';
import bcrypt from 'bcryptjs';

export const hubStaffService = {

  // Get staff profile with delivery stats
  async getProfile(staffId: string) {
    try {
      const staff = await Staff.findById(staffId)
        .populate('hubId', 'hubName city pincode address state phoneNo');

      if (!staff || staff.type !== 'hub') {
        return { success: false, message: 'Hub staff not found' };
      }

      const hubId = staff.hubId ? (staff.hubId as any)._id.toString() : null;

      // Delivery stats
      const totalDeliveries = hubId
        ? await Shipment.countDocuments({ assignedHubId: hubId, status: 'delivered' })
        : 0;

      const totalOrders = hubId
        ? await Shipment.countDocuments({ assignedHubId: hubId })
        : 0;

      return {
        success: true,
        data: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          type: staff.type,
          status: staff.status,
          hubId: staff.hubId,
          username: staff.username,
          totalDeliveries,
          totalOrders,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get profile' };
    }
  },

  // My Tasks - active/in-progress orders assigned to this hub
  async getMyTasks(staffId: string, page: number = 1, limit: number = 10) {
    try {
      const staff = await Staff.findById(staffId).select('hubId type');
      if (!staff || staff.type !== 'hub' || !staff.hubId) {
        return { success: false, message: 'Hub staff access required' };
      }

      const hubId = staff.hubId.toString();
      const skip = (page - 1) * limit;

      const query = {
        assignedHubId: hubId,
        status: { $in: ['Active', 'in_transit', 'created', 'pending'] },
      };

      const orders = await Shipment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Shipment.countDocuments(query);

      return {
        success: true,
        data: orders.map((o) => ({
          orderId: o.orderId,
          status: o.status,
          assignedStaffId: o.assignedStaffId || null,
          consignee: {
            name: o.name,
            phone: o.phone,
            address: o.add,
            city: o.city,
            state: o.state,
            pin: o.pin,
          },
          from: {
            name: o.fromName,
            phone: o.fromPhone,
            address: o.fromAdd,
            city: o.fromCity,
            state: o.fromState,
            pin: o.fromPin,
          },
          shippingMode: o.shippingMode,
          paymentMode: o.paymentMode,
          createdAt: o.createdAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get tasks' };
    }
  },

  // Delivery History - completed orders
  async getDeliveryHistory(staffId: string, page: number = 1, limit: number = 10) {
    try {
      const staff = await Staff.findById(staffId).select('hubId type');
      if (!staff || staff.type !== 'hub' || !staff.hubId) {
        return { success: false, message: 'Hub staff access required' };
      }

      const hubId = staff.hubId.toString();
      const skip = (page - 1) * limit;

      const query = {
        assignedHubId: hubId,
        status: { $in: ['delivered', 'cancelled', 'failed'] },
      };

      const orders = await Shipment.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Shipment.countDocuments(query);

      return {
        success: true,
        data: orders.map((o) => ({
          orderId: o.orderId,
          status: o.status,
          assignedStaffId: o.assignedStaffId || null,
          consignee: {
            name: o.name,
            phone: o.phone,
            address: o.add,
            city: o.city,
            state: o.state,
            pin: o.pin,
          },
          from: {
            name: o.fromName,
            phone: o.fromPhone,
            address: o.fromAdd,
            city: o.fromCity,
            state: o.fromState,
            pin: o.fromPin,
          },
          shippingMode: o.shippingMode,
          paymentMode: o.paymentMode,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get delivery history' };
    }
  },

  // Booking Detail - full order detail with charges
  async getBookingDetail(staffId: string, orderId: string) {
    try {
      const staff = await Staff.findById(staffId).select('hubId type');
      if (!staff || staff.type !== 'hub' || !staff.hubId) {
        return { success: false, message: 'Hub staff access required' };
      }

      const hubId = staff.hubId.toString();

      const order = await Shipment.findOne({ orderId, assignedHubId: hubId }).lean();
      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Charge breakdown
      const amount = parseFloat(
        order.paymentMode === 'COD'
          ? (order.codAmount || '0')
          : (order.totalAmount || '0')
      );
      const tax = parseFloat((amount * 0.046).toFixed(2)); // 4.6% GST
      const deliveryCharge = amount;
      const totalAmount = parseFloat((deliveryCharge + tax).toFixed(2));

      return {
        success: true,
        data: {
          orderId: order.orderId,
          waybill: order.waybill,
          status: order.status,
          trackingUrl: order.trackingUrl,
          // Address Details
          pickup: {
            name: order.fromName,
            address: order.fromAdd,
            city: order.fromCity,
            state: order.fromState,
            pin: order.fromPin,
            phone: order.fromPhone,
          },
          delivery: {
            name: order.name,
            address: order.add,
            city: order.city,
            state: order.state,
            pin: order.pin,
            phone: order.phone,
          },
          // Package Details
          package: {
            productsDesc: order.productsDesc,
            weight: order.weight,
            dimensions: {
              width: order.shipmentWidth,
              height: order.shipmentHeight,
            },
            quantity: order.quantity,
            hsnCode: order.hsnCode,
          },
          // Delivery Type
          deliveryType: {
            shippingMode: order.shippingMode,
            paymentMode: order.paymentMode,
          },
          // Charges
          charges: {
            deliveryCharge,
            tax,
            totalAmount,
          },
          pickupLocation: order.pickupLocation,
          assignedStaffId: order.assignedStaffId || null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get booking detail' };
    }
  },

  // Update order status (confirm pickup/delivery)
  async updateOrderStatus(staffId: string, orderId: string, status: string) {
    try {
      const staff = await Staff.findById(staffId).select('hubId type');
      if (!staff || staff.type !== 'hub' || !staff.hubId) {
        return { success: false, message: 'Hub staff access required' };
      }

      const hubId = staff.hubId.toString();
      const validStatuses = ['Active', 'in_transit', 'delivered', 'failed'];
      if (!validStatuses.includes(status)) {
        return { success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` };
      }

      const order = await Shipment.findOne({ orderId, assignedHubId: hubId });
      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.status === 'delivered') {
        return { success: false, message: 'Cannot update delivered order' };
      }

      if (order.status === 'cancelled') {
        return { success: false, message: 'Cannot update cancelled order' };
      }

      order.status = status as any;
      await order.save();

      return {
        success: true,
        message: `Order status updated to ${status}`,
        data: {
          orderId: order.orderId,
          status: order.status,
          updatedAt: order.updatedAt,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update order status' };
    }
  },

  // Update staff account settings
  async updateAccountSettings(staffId: string, data: { name?: string; phone?: string; password?: string }) {
    try {
      const staff = await Staff.findById(staffId).select('+password');
      if (!staff || staff.type !== 'hub') {
        return { success: false, message: 'Hub staff not found' };
      }

      if (data.name) staff.name = data.name;
      if (data.phone) staff.phone = data.phone;
      if (data.password) {
        staff.password = await bcrypt.hash(data.password, 10);
      }

      await staff.save();

      const staffData: any = staff.toObject();
      delete staffData.password;

      return { success: true, message: 'Account updated successfully', data: staffData };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update account' };
    }
  },
};
