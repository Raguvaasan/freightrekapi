import axios from 'axios';
import { Shipment } from '../models/shipment/shipment.model';
import { Wallet } from '../models/wallet/wallet.model';
import { Transaction } from '../models/wallet/transaction.model';
import { Agency } from '../models/admin/agency.model';

interface CreateShipmentData {
  userId: string;
  name: string;
  add: string;
  pin: string;
  city: string;
  state: string;
  country?: string;
  phone: string;
  order: string;
  paymentMode: 'Prepaid' | 'COD';
  returnPin?: string;
  returnCity?: string;
  returnPhone?: string;
  returnAdd?: string;
  returnState?: string;
  returnCountry?: string;
  productsDesc?: string;
  hsnCode?: string;
  codAmount?: string;
  orderDate?: Date;
  totalAmount?: string;
  sellerAdd?: string;
  sellerName?: string;
  sellerInv?: string;
  quantity?: string;
  waybill?: string;
  shipmentWidth?: string;
  shipmentHeight?: string;
  weight?: string;
  shippingMode?: 'Surface' | 'Express';
  addressType?: string;
  pickupLocation: {
    name: string;
  };
}

export const shipmentService = {
  async createShipment(data: CreateShipmentData) {
    try {
      const { userId, ...shipmentData } = data;

      // Generate unique order ID if not provided
      const orderId = `ORD_${userId}_${Date.now()}`;

      // Handle Prepaid payment - Deduct from wallet
      if (shipmentData.paymentMode === 'Prepaid') {
        const amount = parseFloat(shipmentData.totalAmount || '0');
        
        if (amount <= 0) {
          console.log('❌ Invalid amount for prepaid order:', amount);
          return {
            success: false,
            message: 'Invalid amount for prepaid order',
          };
        }

        // Check wallet balance
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          wallet = await Wallet.create({ userId, balance: 0 });
        }

        console.log(`💰 Wallet check - Balance: ₹${wallet.balance}, Required: ₹${amount}`);

        if (wallet.balance < amount) {
          console.log(`❌ Insufficient wallet balance - Available: ₹${wallet.balance}, Required: ₹${amount}`);
          return {
            success: false,
            message: `Insufficient wallet balance. Available: ₹${wallet.balance}, Required: ₹${amount}`,
          };
        }

        // Deduct amount from wallet
        const balanceBefore = wallet.balance;
        wallet.balance -= amount;
        await wallet.save();

        // Create debit transaction
        const transactionId = `TXN_${orderId}_${Date.now()}`;
        await Transaction.create({
          transactionId,
          userId,
          orderId,
          amount,
          type: 'debit',
          status: 'completed',
          description: `Prepaid order - ${orderId}`,
          paymentMethod: 'wallet',
          balanceBefore,
          balanceAfter: wallet.balance,
        });
      }

      // Create shipment in database
      const shipment = await Shipment.create({
        userId,
        orderId,
        ...shipmentData,
        country: shipmentData.country || 'India',
        shippingMode: shipmentData.shippingMode || 'Surface',
        shipmentWidth: shipmentData.shipmentWidth || '100',
        shipmentHeight: shipmentData.shipmentHeight || '100',
        status: 'pending',
      });

      // Prepare Delhivery API request
      const delhiveryPayload = {
        shipments: [
          {
            name: shipmentData.name,
            add: shipmentData.add,
            pin: shipmentData.pin,
            city: shipmentData.city,
            state: shipmentData.state,
            country: shipmentData.country || 'India',
            phone: shipmentData.phone,
            order: shipmentData.order,
            payment_mode: shipmentData.paymentMode,
            return_pin: shipmentData.returnPin || '',
            return_city: shipmentData.returnCity || '',
            return_phone: shipmentData.returnPhone || '',
            return_add: shipmentData.returnAdd || '',
            return_state: shipmentData.returnState || '',
            return_country: shipmentData.returnCountry || '',
            products_desc: shipmentData.productsDesc || '',
            hsn_code: shipmentData.hsnCode || '',
            cod_amount: shipmentData.codAmount || '',
            order_date: shipmentData.orderDate || null,
            total_amount: shipmentData.totalAmount || '',
            seller_add: shipmentData.sellerAdd || '',
            seller_name: shipmentData.sellerName || '',
            seller_inv: shipmentData.sellerInv || '',
            quantity: shipmentData.quantity || '',
            waybill: shipmentData.waybill || '',
            shipment_width: shipmentData.shipmentWidth || '100',
            shipment_height: shipmentData.shipmentHeight || '100',
            weight: shipmentData.weight || '',
            shipping_mode: shipmentData.shippingMode || 'Surface',
            address_type: shipmentData.addressType || '',
          },
        ],
        pickup_location: shipmentData.pickupLocation,
      };

      // Call Delhivery API
      const delhiveryUrl = process.env.DELHIVERY_API_URL || 'https://staging-express.delhivery.com';
      const delhiveryToken = process.env.DELHIVERY_API_TOKEN;

      if (!delhiveryToken) {
        throw new Error('Delhivery API token not configured');
      }

      const response = await axios.post(
        `${delhiveryUrl}/api/cmu/create.json`,
        `format=json&data=${JSON.stringify(delhiveryPayload)}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Token ${delhiveryToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update shipment with Delhivery response
      if (response.data.success) {
        shipment.status = 'created';
        shipment.delhiveryResponse = response.data;
        
        // Extract waybill if available
        if (response.data.packages && response.data.packages[0]) {
          shipment.waybill = response.data.packages[0].waybill;
          shipment.trackingUrl = `${delhiveryUrl}/track/package/${shipment.waybill}`;
        }
      } else {
        shipment.status = 'failed';
        shipment.delhiveryResponse = response.data;
      }

      await shipment.save();

      return {
        success: true,
        data: {
          orderId: shipment.orderId,
          waybill: shipment.waybill,
          status: shipment.status,
          trackingUrl: shipment.trackingUrl,
          delhiveryResponse: response.data,
        },
      };
    } catch (error: any) {
      console.error('Create shipment error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create shipment',
      };
    }
  },

  async getShipment(orderId: string, userId: string) {
    try {
      const shipment = await Shipment.findOne({ orderId, userId }).lean();

      if (!shipment) {
        return {
          success: false,
          message: 'Shipment not found',
        };
      }

      return {
        success: true,
        data: {
          orderId: shipment.orderId,
          waybill: shipment.waybill,
          status: shipment.status,
          trackingUrl: shipment.trackingUrl,
          consignee: {
            name: shipment.name,
            address: shipment.add,
            city: shipment.city,
            state: shipment.state,
            pin: shipment.pin,
            phone: shipment.phone,
          },
          shipmentDetails: {
            order: shipment.order,
            paymentMode: shipment.paymentMode,
            shippingMode: shipment.shippingMode,
            weight: shipment.weight,
            dimensions: {
              width: shipment.shipmentWidth,
              height: shipment.shipmentHeight,
            },
          },
          pickupLocation: shipment.pickupLocation,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
        },
      };
    } catch (error: any) {
      console.error('Get shipment error:', error);
      return {
        success: false,
        message: 'Failed to fetch shipment',
      };
    }
  },

  async getShipments(userId: string, page: number = 1, limit: number = 20, status?: string, isAdmin?: boolean, franchiseUserIds?: string[]) {
    try {
      // If admin, show all franchise orders (not admin's own)
      // Otherwise, filter by logged-in userId
      const query: any = {};
      
      if (isAdmin && franchiseUserIds && franchiseUserIds.length > 0) {
        // Admin: show only franchise orders
        query.userId = { $in: franchiseUserIds };
      } else {
        // Non-admin: show only their own orders
        query.userId = userId;
      }
      
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const shipments = await Shipment.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await Shipment.countDocuments(query);

      // Get unique userIds to fetch franchise names
      const userIds = [...new Set(shipments.map(s => s.userId))];
      const agencies = await Agency.find({ _id: { $in: userIds } }, 'agencyName');
      const agencyMap = new Map(agencies.map(agency => [agency._id.toString(), agency.agencyName]));

      return {
        success: true,
        data: shipments.map((s) => ({
          orderId: s.orderId,
          userId: s.userId,
          franchiseName: agencyMap.get(s.userId) || 'Unknown',
          bookingId: s.waybill,
          status: s.status,
          consigneeName: s.name,
          consigneeNumber: s.phone,
          city: s.city,
          paymentMode: s.paymentMode,
          amount: s.codAmount || s.totalAmount || '0',
          createdAt: s.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Get shipments error:', error);
      return {
        success: false,
        message: 'Failed to fetch shipments',
      };
    }
  },

  async trackShipment(waybill: string, userId: string) {
    try {
      // Find shipment in database
      const shipment = await Shipment.findOne({ waybill, userId });

      if (!shipment) {
        return {
          success: false,
          message: 'Shipment not found',
        };
      }

      // Call Delhivery tracking API
      const delhiveryUrl = process.env.DELHIVERY_API_URL || 'https://staging-express.delhivery.com';
      const delhiveryToken = process.env.DELHIVERY_API_TOKEN;

      if (!delhiveryToken) {
        throw new Error('Delhivery API token not configured');
      }

      const response = await axios.get(
        `${delhiveryUrl}/api/v1/packages/json/?waybill=${waybill}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Token ${delhiveryToken}`,
          },
        }
      );

      return {
        success: true,
        data: {
          orderId: shipment.orderId,
          waybill: shipment.waybill,
          status: shipment.status,
          tracking: response.data,
        },
      };
    } catch (error: any) {
      console.error('Track shipment error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to track shipment',
      };
    }
  },
};
