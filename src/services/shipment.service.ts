import axios from 'axios';
import { Shipment } from '../models/shipment/shipment.model';
import { Wallet } from '../models/wallet/wallet.model';
import { Transaction } from '../models/wallet/transaction.model';
import { Agency } from '../models/admin/agency.model';
import { HubModel } from '../models/hub/hub.model';

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
  fromName?: string;
  fromAdd?: string;
  fromPin?: string;
  fromCity?: string;
  fromState?: string;
  fromCountry?: string;
  fromPhone?: string;
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
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  };
}

export const shipmentService = {
  async createShipment(data: CreateShipmentData) {
    let walletDebited = false;
    let debitAmount = 0;
    let debitUserId = '';
    let debitOrderId = '';

    try {
      const { userId, ...shipmentData } = data;

      // Generate unique order ID if not provided
      const orderId = `ORD_${userId}_${Date.now()}`;
      debitOrderId = orderId;

      // Handle Prepaid payment
      if (shipmentData.paymentMode === 'Prepaid') {
        const amount = parseFloat(shipmentData.totalAmount || '0');
        
        if (amount <= 0) {
          console.log('❌ Invalid amount for prepaid order:', amount);
          return {
            success: false,
            message: 'Invalid amount for prepaid order',
          };
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          wallet = await Wallet.create({ userId, balance: 0 });
        }

        if (wallet.balance < amount) {
          return {
            success: false,
            message: 'Insufficient wallet balance',
            data: {
              requiredAmount: amount,
              availableBalance: wallet.balance,
            },
          };
        }

        const balanceBefore = wallet.balance;
        wallet.balance -= amount;
        await wallet.save();

        await Transaction.create({
          transactionId: `TXN_DEBIT_${orderId}_${Date.now()}`,
          userId,
          orderId,
          amount,
          type: 'debit',
          status: 'completed',
          description: `Shipment payment deducted - ${orderId}`,
          paymentMethod: 'wallet',
          balanceBefore,
          balanceAfter: wallet.balance,
          metadata: {
            source: 'shipment_create',
          },
        });

        walletDebited = true;
        debitAmount = amount;
        debitUserId = userId;
      }


      // Fetch pickup location details from Hub or Agency if not provided
      if (shipmentData.pickupLocation && (!shipmentData.pickupLocation.address || !shipmentData.pickupLocation.pincode)) {
        // First try to find in Hub collection
        const hub = await HubModel.findOne({ hubName: shipmentData.pickupLocation.name });
        if (hub) {
          shipmentData.pickupLocation.address = hub.address;
          shipmentData.pickupLocation.pincode = hub.pincode.toString();
          shipmentData.pickupLocation.city = shipmentData.pickupLocation.city || hub.city;
          shipmentData.pickupLocation.state = shipmentData.pickupLocation.state || hub.state;
          shipmentData.pickupLocation.phone = shipmentData.pickupLocation.phone || hub.phoneNo?.toString();
        } else {
          // If not found in Hub, try to find in Agency collection
          const agency = await Agency.findOne({ agencyName: shipmentData.pickupLocation.name });
          if (agency) {
            shipmentData.pickupLocation.address = agency.address;
            shipmentData.pickupLocation.pincode = agency.pincode;
            shipmentData.pickupLocation.city = shipmentData.pickupLocation.city || agency.city;
            shipmentData.pickupLocation.state = shipmentData.pickupLocation.state || agency.state;
            shipmentData.pickupLocation.phone = shipmentData.pickupLocation.phone || agency.phone;
          }
        }
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
        status: 'Active',
      });

      // Try Delhivery API to get waybill (optional - order is already created)
      try {
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
              return_pin: shipmentData.returnPin || shipmentData.pickupLocation.pincode || '',
              return_city: shipmentData.returnCity || shipmentData.pickupLocation.city || '',
              return_phone: shipmentData.returnPhone || shipmentData.pickupLocation.phone || '',
              return_add: shipmentData.returnAdd || shipmentData.pickupLocation.address || '',
              return_state: shipmentData.returnState || shipmentData.pickupLocation.state || '',
              return_country: shipmentData.returnCountry || 'India',
              products_desc: shipmentData.productsDesc || '',
              hsn_code: shipmentData.hsnCode || '',
              cod_amount: shipmentData.codAmount || '0',
              order_date: shipmentData.orderDate
                ? new Date(shipmentData.orderDate).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              total_amount: shipmentData.totalAmount || '0',
              seller_add: shipmentData.sellerAdd || shipmentData.pickupLocation.address || '',
              seller_name: shipmentData.sellerName || shipmentData.pickupLocation.name || '',
              seller_inv: shipmentData.sellerInv || '',
              quantity: shipmentData.quantity || '1',
              waybill: shipmentData.waybill || '',
              shipment_width: shipmentData.shipmentWidth || '10',
              shipment_height: shipmentData.shipmentHeight || '10',
              weight: shipmentData.weight || '0.5',
              shipping_mode: shipmentData.shippingMode || 'Surface',
              address_type: shipmentData.addressType || 'home',
            },
          ],
          pickup_location: {
            name: shipmentData.pickupLocation.name,
            add: shipmentData.pickupLocation.address || '',
            city: shipmentData.pickupLocation.city || '',
            pin_code: shipmentData.pickupLocation.pincode || '',
            country: shipmentData.pickupLocation.country || 'India',
            phone: shipmentData.pickupLocation.phone || '',
          },
        };

        const delhiveryUrl =
          process.env.DELHIVERY_API_URL ||
          process.env.DELHIVERY_API_BASE_URL ||
          'https://staging-express.delhivery.com';
        const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();

        if (delhiveryToken) {
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
            shipment.waybill = response.data.packages[0].waybill;
            shipment.trackingUrl = `${delhiveryUrl}/track/package/${shipment.waybill}`;
            shipment.delhiveryResponse = response.data;
            await shipment.save();
          } else {
            shipment.delhiveryResponse = response.data;
            await shipment.save();
          }
        }
      } catch (delhiveryError: any) {
        // Delhivery failed but order is already created - just log it
        console.error('Delhivery API error (order still created):', delhiveryError?.response?.data || delhiveryError?.message);
        shipment.delhiveryResponse = { error: delhiveryError?.response?.data || delhiveryError?.message };
        await shipment.save();
      }

      return {
        success: true,
        data: {
          orderId: shipment.orderId,
          waybill: shipment.waybill || '',
          status: shipment.status,
          trackingUrl: shipment.trackingUrl || '',
          // Receiver details
          name: shipment.name,
          address: shipment.add,
          city: shipment.city,
          state: shipment.state,
          pincode: shipment.pin,
          phone: shipment.phone,
          country: shipment.country,
          // Order details
          paymentMode: shipment.paymentMode,
          totalAmount: shipment.totalAmount || '0',
          codAmount: shipment.codAmount || '0',
          productsDesc: shipment.productsDesc || '',
          quantity: shipment.quantity || '1',
          weight: shipment.weight || '',
          shippingMode: shipment.shippingMode,
          // Pickup
          pickupLocation: shipment.pickupLocation,
          // Timestamps
          createdAt: shipment.createdAt,
        },
      };
    } catch (error: any) {
      if (walletDebited && debitAmount > 0 && debitUserId) {
        try {
          let wallet = await Wallet.findOne({ userId: debitUserId });
          if (!wallet) {
            wallet = await Wallet.create({ userId: debitUserId, balance: 0 });
          }

          const balanceBefore = wallet.balance;
          wallet.balance += debitAmount;
          await wallet.save();

          await Transaction.create({
            transactionId: `TXN_REVERSAL_${debitOrderId}_${Date.now()}`,
            userId: debitUserId,
            orderId: debitOrderId,
            amount: debitAmount,
            type: 'reversal',
            status: 'completed',
            description: `Wallet debit reversed for failed shipment - ${debitOrderId}`,
            paymentMethod: 'wallet',
            balanceBefore,
            balanceAfter: wallet.balance,
            metadata: {
              source: 'shipment_create_failure',
            },
          });
        } catch (reversalError) {
          console.error('Wallet reversal failed after shipment error:', reversalError);
        }
      }

      console.error('Create shipment error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create shipment',
      };
    }
  },

  async getShipment(orderId: string, userId: string, isAdmin?: boolean) {
    try {
      // If admin, allow viewing any order. Otherwise, only user's own orders
      const query: any = { orderId };
      if (!isAdmin) {
        query.userId = userId;
      }

      const shipment = await Shipment.findOne(query).lean();

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
          from: {
            name: shipment.fromName,
            address: shipment.fromAdd,
            city: shipment.fromCity,
            state: shipment.fromState,
            pin: shipment.fromPin,
            country: shipment.fromCountry,
            phone: shipment.fromPhone,
          },
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
          amount:
            shipment.paymentMode == 'COD'
              ? (shipment.codAmount || '0')
              : (shipment.totalAmount || '0'),
          totalAmount: shipment.totalAmount || '0',
          codAmount: shipment.codAmount || '0',
          productsDesc: shipment.productsDesc || '',
          quantity: shipment.quantity || '1',
          sellerName: shipment.sellerName || '',
          sellerInv: shipment.sellerInv || '',
          hsnCode: shipment.hsnCode || '',
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
      } else {
        // Exclude soft-deleted (cancelled) orders unless explicitly requested
        query.status = { $ne: 'cancelled' };
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

      // Get unique pickup location names to fetch hub and agency details
      const pickupLocationNames = [...new Set(shipments.map(s => s.pickupLocation?.name).filter(Boolean))];
      
      // Try to find in Hub collection first
      const hubs = await HubModel.find({ hubName: { $in: pickupLocationNames } }, 'hubName address pincode');
      const hubMap = new Map(hubs.map(hub => [hub.hubName, { address: hub.address, pincode: hub.pincode.toString() }]));
      
      // Also try to find in Agency collection (for franchise-based pickup locations)
      const agenciesForPickup = await Agency.find({ agencyName: { $in: pickupLocationNames } }, 'agencyName address pincode');
      const agencyPickupMap = new Map(agenciesForPickup.map(agency => [agency.agencyName, { address: agency.address, pincode: agency.pincode }]));

      return {
        success: true,
        data: shipments.map((s) => {
          const hubDetails = hubMap.get(s.pickupLocation?.name);
          const agencyDetails = agencyPickupMap.get(s.pickupLocation?.name);
          const pickupDetails = hubDetails || agencyDetails;
          return {
          orderId: s.orderId,
          userId: s.userId,
          franchiseName: agencyMap.get(s.userId) || 'Unknown',
          waybill: s.waybill,
          status: s.status,
          trackingUrl: s.trackingUrl,
          from: {
            name: s.fromName,
            address: s.fromAdd,
            phone: s.fromPhone,
            city: s.fromCity,
            state: s.fromState,
            pin: s.fromPin,
            country: s.fromCountry,
          },
          consignee: {
            name: s.name,
            phone: s.phone,
            address: s.add,
            city: s.city,
            state: s.state,
            pin: s.pin,
          },
          shipmentDetails: {
            order: s.order,
            paymentMode: s.paymentMode,
            shippingMode: s.shippingMode,
            weight: s.weight,
          },
          amount:
            s.paymentMode === 'COD'
              ? (s.codAmount || '0')
              : (s.totalAmount || s.codAmount || '0'),
          pickupLocation: {
            name: s.pickupLocation?.name,
            address: s.pickupLocation?.address || pickupDetails?.address,
            pincode: s.pickupLocation?.pincode || pickupDetails?.pincode,
          },
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
        }),
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

  async trackShipment(waybill: string, userId: string, isAdmin?: boolean) {
    try {
      // If admin, allow tracking any shipment. Otherwise, only user's own shipments
      const query: any = { waybill };
      if (!isAdmin) {
        query.userId = userId;
      }

      // Find shipment in database
      const shipment = await Shipment.findOne(query);

      if (!shipment) {
        return {
          success: false,
          message: 'Shipment not found',
        };
      }

      // Call Delhivery tracking API
      const delhiveryUrl =
        process.env.DELHIVERY_API_URL ||
        process.env.DELHIVERY_API_BASE_URL ||
        'https://staging-express.delhivery.com';
      const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();

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

  async updateShipment(orderId: string, userId: string, updateData: any, isAdmin?: boolean) {
    try {
      // If admin, allow updating any order. Otherwise, only user's own orders
      const query: any = { orderId };
      if (!isAdmin) {
        query.userId = userId;
      }

      const shipment = await Shipment.findOne(query);

      if (!shipment) {
        return {
          success: false,
          message: 'Shipment not found',
        };
      }

      // Prevent updating delivered shipments
      if (shipment.status === 'delivered') {
        return {
          success: false,
          message: 'Cannot update delivered shipment',
        };
      }

      // Update only provided fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          (shipment as any)[key] = updateData[key];
        }
      });

      await shipment.save();

      return {
        success: true,
        message: 'Shipment updated successfully',
        data: {
          orderId: shipment.orderId,
          waybill: shipment.waybill,
          status: shipment.status,
          updatedAt: shipment.updatedAt,
        },
      };
    } catch (error: any) {
      console.error('Update shipment error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update shipment',
      };
    }
  },

  async deleteShipment(orderId: string, userId: string, isAdmin?: boolean) {
    try {
      // If admin, allow deleting any order. Otherwise, only user's own orders
      const query: any = { orderId };
      if (!isAdmin) {
        query.userId = userId;
      }

      const shipment = await Shipment.findOne(query);

      if (!shipment) {
        return {
          success: false,
          message: 'Shipment not found',
        };
      }

      // Prevent deleting delivered shipments
      if (shipment.status === 'delivered') {
        return {
          success: false,
          message: 'Cannot delete delivered shipment',
        };
      }

      // Soft delete by setting status to cancelled
      shipment.status = 'cancelled';
      await shipment.save();

      // If prepaid, refund to wallet
      if (shipment.paymentMode === 'Prepaid' && shipment.totalAmount) {
        const amount = parseFloat(shipment.totalAmount);
        
        if (amount > 0) {
          let wallet = await Wallet.findOne({ userId });
          if (!wallet) {
            wallet = await Wallet.create({ userId, balance: 0 });
          }

          const balanceBefore = wallet.balance;
          wallet.balance += amount;
          await wallet.save();

          // Create refund transaction
          const transactionId = `TXN_REFUND_${orderId}_${Date.now()}`;
          await Transaction.create({
            transactionId,
            userId,
            orderId,
            amount,
            type: 'refund',
            status: 'completed',
            description: `Refund for cancelled shipment - ${orderId}`,
            paymentMethod: 'wallet',
            balanceBefore,
            balanceAfter: wallet.balance,
          });

          console.log(`💰 Refund processed: ₹${amount} refunded to wallet`);
        }
      }

      return {
        success: true,
        message: 'Shipment cancelled successfully',
        data: {
          orderId: shipment.orderId,
          status: shipment.status,
          refunded: shipment.paymentMode === 'Prepaid',
          refundAmount: shipment.totalAmount || '0',
        },
      };
    } catch (error: any) {
      console.error('Delete shipment error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete shipment',
      };
    }
  },
};
