import { Staff } from '../../models/admin/staff.model';
import { Shipment } from '../../models/shipment/shipment.model';
import { HubModel } from '../../models/hub/hub.model';
import bcrypt from 'bcryptjs';
import axios from 'axios';

// Helper: resolve hubId from hub direct or hub staff
const resolveHubId = async (userId: string): Promise<string | null> => {
  const staff = await Staff.findById(userId).select('hubId type');
  if (staff && staff.type === 'hub' && staff.hubId) {
    return staff.hubId.toString();
  }
  const hub = await HubModel.findById(userId);
  if (hub) {
    return hub._id.toString();
  }
  return null;
};

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
      const hubId = await resolveHubId(staffId);
      if (!hubId) {
        return { success: false, message: 'Hub access required' };
      }
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
      const hubId = await resolveHubId(staffId);
      if (!hubId) {
        return { success: false, message: 'Hub access required' };
      }
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
      const hubId = await resolveHubId(staffId);
      if (!hubId) {
        return { success: false, message: 'Hub access required' };
      }

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
          delhiveryResponse: order.delhiveryResponse || null,
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
      const hubId = await resolveHubId(staffId);
      if (!hubId) {
        return { success: false, message: 'Hub access required' };
      }
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

      // If status changed to Active (confirmed) and no waybill yet, call Delhivery create API
      let delhiveryResult: any = null;
      if (status === 'Active' && !order.waybill) {
        try {
          const delhiveryUrl =
            process.env.DELHIVERY_API_URL ||
            process.env.DELHIVERY_API_BASE_URL ||
            'https://staging-express.delhivery.com';
          const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();

          if (delhiveryToken) {
            const pickup: any = order.pickupLocation || {};
            const delhiveryPayload = {
              shipments: [
                {
                  name: order.name,
                  add: order.add,
                  pin: order.pin,
                  city: order.city,
                  state: order.state,
                  country: order.country || 'India',
                  phone: order.phone,
                  order: order.order,
                  payment_mode: order.paymentMode,
                  return_pin: order.returnPin || pickup.pincode || '',
                  return_city: order.returnCity || pickup.city || '',
                  return_phone: order.returnPhone || pickup.phone || '',
                  return_add: order.returnAdd || pickup.address || '',
                  return_state: order.returnState || pickup.state || '',
                  return_country: order.returnCountry || 'India',
                  products_desc: order.productsDesc || '',
                  hsn_code: order.hsnCode || '',
                  cod_amount: order.codAmount || '0',
                  order_date: order.orderDate
                    ? new Date(order.orderDate).toISOString().slice(0, 10)
                    : new Date().toISOString().slice(0, 10),
                  total_amount: order.totalAmount || '0',
                  seller_add: order.sellerAdd || pickup.address || '',
                  seller_name: order.sellerName || pickup.name || '',
                  seller_inv: order.sellerInv || '',
                  quantity: order.quantity || '1',
                  waybill: '',
                  shipment_width: order.shipmentWidth || '10',
                  shipment_height: order.shipmentHeight || '10',
                  weight: order.weight || '0.5',
                  shipping_mode: order.shippingMode || 'Surface',
                  address_type: order.addressType || 'home',
                },
              ],
              pickup_location: {
                name: pickup.name || '',
                add: pickup.address || '',
                city: pickup.city || '',
                pin_code: pickup.pincode || '',
                country: 'India',
                phone: pickup.phone || '',
              },
            };

            const response = await axios.post(
              `${delhiveryUrl}/api/cmu/create.json`,
              `format=json&data=${encodeURIComponent(JSON.stringify(delhiveryPayload))}`,
              {
                headers: {
                  Accept: 'application/json',
                  Authorization: `Token ${delhiveryToken}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              }
            );

            const isDelhiveryCreated =
              response.data?.success === true ||
              (Array.isArray(response.data?.packages) && response.data.packages.length > 0);

            if (isDelhiveryCreated && response.data.packages?.[0]) {
              order.waybill = response.data.packages[0].waybill;
              order.trackingUrl = `${delhiveryUrl}/track/package/${order.waybill}`;
              order.delhiveryResponse = response.data;
            } else {
              order.delhiveryResponse = response.data;
            }
            delhiveryResult = response.data;
            await order.save();
          }
        } catch (delhiveryError: any) {
          console.error('Delhivery API error on status confirm:', delhiveryError?.response?.data || delhiveryError?.message);
          order.delhiveryResponse = { error: delhiveryError?.response?.data || delhiveryError?.message };
          await order.save();
          delhiveryResult = { error: delhiveryError?.response?.data || delhiveryError?.message };
        }
      }

      return {
        success: true,
        message: `Order status updated to ${status}`,
        data: {
          orderId: order.orderId,
          waybill: order.waybill || null,
          trackingUrl: order.trackingUrl || null,
          status: order.status,
          delhiveryResponse: order.delhiveryResponse || null,
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

  // Edit order details (verify & correct by staff)
  async editOrder(staffId: string, orderId: string, updateData: {
    weight?: string;
    shipmentWidth?: string;
    shipmentHeight?: string;
    quantity?: string;
    productsDesc?: string;
    codAmount?: string;
    totalAmount?: string;
    name?: string;
    add?: string;
    pin?: string;
    city?: string;
    state?: string;
    phone?: string;
    paymentMode?: 'Prepaid' | 'COD';
    shippingMode?: 'Surface' | 'Express';
    assignedStaffId?: string;
    status?: string;
  }) {
    try {
      const hubId = await resolveHubId(staffId);
      if (!hubId) {
        return { success: false, message: 'Hub access required' };
      }

      const order = await Shipment.findOne({ orderId, assignedHubId: hubId });
      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.status === 'delivered') {
        return { success: false, message: 'Cannot edit delivered order' };
      }
      if (order.status === 'cancelled') {
        return { success: false, message: 'Cannot edit cancelled order' };
      }

      // Validate assignedStaffId belongs to the same hub
      if (updateData.assignedStaffId) {
        const assignedStaff = await Staff.findById(updateData.assignedStaffId).select('hubId type status');
        if (!assignedStaff || assignedStaff.type !== 'hub' || !assignedStaff.hubId || assignedStaff.hubId.toString() !== hubId) {
          return { success: false, message: 'Assigned staff must belong to the same hub' };
        }
        if (assignedStaff.status !== 'Active') {
          return { success: false, message: 'Assigned staff must be active' };
        }
      }

      // Validate status if provided
      if (updateData.status) {
        const validStatuses = ['pending', 'Active', 'in_transit', 'delivered', 'failed'];
        if (!validStatuses.includes(updateData.status)) {
          return { success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` };
        }
      }

      // Store original amounts for comparison
      const originalAmount = parseFloat(
        order.paymentMode === 'COD'
          ? (order.codAmount || '0')
          : (order.totalAmount || '0')
      );
      const originalTax = parseFloat((originalAmount * 0.046).toFixed(2));
      const originalTotal = parseFloat((originalAmount + originalTax).toFixed(2));

      // Apply editable fields
      const editableFields: (keyof typeof updateData)[] = [
        'weight', 'shipmentWidth', 'shipmentHeight', 'quantity',
        'productsDesc', 'codAmount', 'totalAmount',
        'name', 'add', 'pin', 'city', 'state', 'phone',
        'paymentMode', 'shippingMode', 'assignedStaffId', 'status',
      ];

      for (const field of editableFields) {
        if (updateData[field] !== undefined && updateData[field] !== '') {
          (order as any)[field] = updateData[field];
        }
      }

      await order.save();

      // Recalculate charges after edit
      const newAmount = parseFloat(
        order.paymentMode === 'COD'
          ? (order.codAmount || '0')
          : (order.totalAmount || '0')
      );
      const newTax = parseFloat((newAmount * 0.046).toFixed(2));
      const newTotal = parseFloat((newAmount + newTax).toFixed(2));

      const extraAmount = parseFloat((newTotal - originalTotal).toFixed(2));

      return {
        success: true,
        message: 'Order updated successfully',
        data: {
          orderId: order.orderId,
          status: order.status,
          // Updated package details
          package: {
            productsDesc: order.productsDesc,
            weight: order.weight,
            dimensions: {
              width: order.shipmentWidth,
              height: order.shipmentHeight,
            },
            quantity: order.quantity,
          },
          // Updated delivery details
          delivery: {
            name: order.name,
            address: order.add,
            city: order.city,
            state: order.state,
            pin: order.pin,
            phone: order.phone,
          },
          deliveryType: {
            shippingMode: order.shippingMode,
            paymentMode: order.paymentMode,
          },
          // Charges comparison
          originalCharges: {
            deliveryCharge: originalAmount,
            tax: originalTax,
            totalAmount: originalTotal,
          },
          updatedCharges: {
            deliveryCharge: newAmount,
            tax: newTax,
            totalAmount: newTotal,
          },
          extraAmount,
          assignedStaffId: order.assignedStaffId || null,
          updatedAt: order.updatedAt,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to edit order' };
    }
  },
};
