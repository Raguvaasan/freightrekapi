import axios from 'axios';
import { LtlShipment } from '../models/shipment/ltlShipment.model';
import { Shipment } from '../models/shipment/shipment.model';
import { HubModel } from '../models/hub/hub.model';
import { Agency } from '../models/admin/agency.model';
import { Types } from 'mongoose';
import { Markup } from '../models/markup/markup.model';

interface CreateLtlShipmentData {
  userId: string;
  lrn?: string;
  pickup_location_name: string;
  payment_mode: 'cod' | 'prepaid';
  cod_amount?: number;
  weight: number;
  dropoff_location: {
    consignee_name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email?: string;
  };
  rov_insurance?: boolean;
  invoices?: Array<{
    ewaybill?: string;
    inv_num: string;
    inv_amt: number;
    inv_qr_code?: string;
  }>;
  shipment_details: Array<{
    order_id: string;
    box_count: number;
    description?: string;
    weight: number;
    waybills?: string[];
    master?: boolean;
  }>;
  doc_data?: Array<{
    doc_type: string;
    doc_meta?: Record<string, any>;
  }>;
  doc_file?: string;
  fm_pickup?: boolean;
  freight_mode: string;
  billing_address: {
    name: string;
    company: string;
    consignor: string;
    address: string;
    city: string;
    state: string;
    pin: string;
    phone: string;
    pan_number?: string;
    gst_number?: string;
  };
  orderType?: 'hub' | 'customer' | 'b2b';
  baseAmount?: number;
  markupAmount?: number;
  markupType?: 'percentage' | 'fixed';
  markupValue?: number;
  totalAmount?: number;
  assignedStaffId?: string;
}

// Find nearest hub based on pincode → city → state → any active hub
async function findNearestHub(pin: string, city: string, state: string) {
  let hub = await HubModel.findOne({ pincode: parseInt(pin), status: true });
  if (hub) return hub;

  hub = await HubModel.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: true });
  if (hub) return hub;

  hub = await HubModel.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: true });
  if (hub) return hub;

  hub = await HubModel.findOne({ status: true });
  return hub;
}

// Find nearest franchise (Agency) based on pincode → city → state → any active franchise
async function findNearestFranchise(pin: string, city: string, state: string) {
  let franchise = await Agency.findOne({ pincode: pin, status: 'Active' });
  if (franchise) return franchise;

  franchise = await Agency.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: 'Active' });
  if (franchise) return franchise;

  franchise = await Agency.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: 'Active' });
  if (franchise) return franchise;

  franchise = await Agency.findOne({ status: 'Active' });
  return franchise;
}

// Find nearest hub or franchise — returns both the entity and its type
async function findNearestAssignment(pin: string, city: string, state: string): Promise<{
  type: 'hub' | 'franchise';
  hub?: any;
  franchise?: any;
} | null> {
  // Priority 1: Exact pincode match (hub first, then franchise)
  const hubByPin = await HubModel.findOne({ pincode: parseInt(pin), status: true });
  if (hubByPin) return { type: 'hub', hub: hubByPin };

  const franchiseByPin = await Agency.findOne({ pincode: pin, status: 'Active' });
  if (franchiseByPin) return { type: 'franchise', franchise: franchiseByPin };

  // Priority 2: Same city
  const hubByCity = await HubModel.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: true });
  if (hubByCity) return { type: 'hub', hub: hubByCity };

  const franchiseByCity = await Agency.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: 'Active' });
  if (franchiseByCity) return { type: 'franchise', franchise: franchiseByCity };

  // Priority 3: Same state
  const hubByState = await HubModel.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: true });
  if (hubByState) return { type: 'hub', hub: hubByState };

  const franchiseByState = await Agency.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: 'Active' });
  if (franchiseByState) return { type: 'franchise', franchise: franchiseByState };

  // Priority 4: Any active hub or franchise
  const anyHub = await HubModel.findOne({ status: true });
  if (anyHub) return { type: 'hub', hub: anyHub };

  const anyFranchise = await Agency.findOne({ status: 'Active' });
  if (anyFranchise) return { type: 'franchise', franchise: anyFranchise };

  return null;
}

export const ltlShipmentService = {
  async createShipment(data: CreateLtlShipmentData) {
    try {
      const { userId, ...shipmentData } = data;

      // Generate unique order ID
      const orderId = `LTL_${userId}_${Date.now()}`;

      // Calculate total amount from invoices if not provided
      let computedTotalAmount = shipmentData.totalAmount || 0;
      if (!computedTotalAmount && shipmentData.invoices && shipmentData.invoices.length > 0) {
        computedTotalAmount = shipmentData.invoices.reduce((sum, inv) => sum + inv.inv_amt, 0);
      }

      // COD validation
      if (shipmentData.payment_mode === 'cod') {
        if (!shipmentData.cod_amount || shipmentData.cod_amount <= 0) {
          return {
            success: false,
            message: 'COD amount is required for COD orders',
          };
        }
      }

      // Auto-assign nearest hub or franchise
      const dropoff = shipmentData.dropoff_location;
      const assignment = await findNearestAssignment(dropoff.zip, dropoff.city, dropoff.state);
      let assignedTo: 'hub' | 'franchise' | undefined;
      let assignedHubId: string | undefined;
      let assignedFranchiseId: string | undefined;
      let assignedDetails: any = null;

      if (assignment) {
        assignedTo = assignment.type;
        if (assignment.type === 'hub' && assignment.hub) {
          assignedHubId = assignment.hub._id.toString();
          assignedDetails = {
            type: 'hub',
            id: assignment.hub._id.toString(),
            name: assignment.hub.hubName,
            managerName: assignment.hub.hubManagerName,
            phone: assignment.hub.phoneNo,
            address: assignment.hub.address,
            city: assignment.hub.city,
            state: assignment.hub.state,
            pincode: assignment.hub.pincode,
          };
        } else if (assignment.type === 'franchise' && assignment.franchise) {
          assignedFranchiseId = assignment.franchise._id.toString();
          assignedDetails = {
            type: 'franchise',
            id: assignment.franchise._id.toString(),
            name: assignment.franchise.agencyName,
            ownerName: assignment.franchise.agencyOwner,
            phone: assignment.franchise.phone,
            email: assignment.franchise.email,
            address: assignment.franchise.address,
            city: assignment.franchise.city,
            state: assignment.franchise.state,
            pincode: assignment.franchise.pincode,
            gstNumber: assignment.franchise.gstNumber,
          };
        }
      }

      // Calculate markup
      let baseAmount: number | undefined;
      let markupAmount: number | undefined;
      let markupType: 'percentage' | 'fixed' | undefined;
      let markupValue: number | undefined;

      if (shipmentData.baseAmount !== undefined && shipmentData.markupAmount !== undefined) {
        baseAmount = shipmentData.baseAmount;
        markupAmount = shipmentData.markupAmount;
        markupType = shipmentData.markupType;
        markupValue = shipmentData.markupValue;
      } else if (computedTotalAmount > 0) {
        baseAmount = computedTotalAmount;
        // Fetch markup: user-specific > global
        const markupQueries: any[] = [
          { markupCategory: 'rate_card', userId: new Types.ObjectId(userId), isActive: true },
          { markupCategory: 'rate_card', userId: null, franchiseId: null, isActive: true },
        ];
        let appliedMarkup: any = null;
        for (const q of markupQueries) {
          appliedMarkup = await Markup.findOne(q).lean();
          if (appliedMarkup) break;
        }
        if (appliedMarkup) {
          markupType = appliedMarkup.markupType;
          markupValue = appliedMarkup.markupValue;
          let addedMarkup: number;
          if (appliedMarkup.markupType === 'percentage') {
            addedMarkup = parseFloat(((computedTotalAmount * appliedMarkup.markupValue) / 100).toFixed(2));
          } else {
            addedMarkup = appliedMarkup.markupValue;
          }
          markupAmount = parseFloat((computedTotalAmount + addedMarkup).toFixed(2));
        } else {
          markupAmount = computedTotalAmount;
        }
      }

      // Create LTL shipment in database
      const shipment = await LtlShipment.create({
        userId,
        orderId,
        lrn: shipmentData.lrn,
        pickup_location_name: shipmentData.pickup_location_name,
        payment_mode: shipmentData.payment_mode,
        cod_amount: shipmentData.cod_amount,
        weight: shipmentData.weight,
        dropoff_location: shipmentData.dropoff_location,
        rov_insurance: shipmentData.rov_insurance || false,
        invoices: shipmentData.invoices,
        shipment_details: shipmentData.shipment_details,
        doc_data: shipmentData.doc_data,
        doc_file: shipmentData.doc_file,
        fm_pickup: shipmentData.fm_pickup || false,
        freight_mode: shipmentData.freight_mode,
        billing_address: shipmentData.billing_address,
        orderType: shipmentData.orderType || 'b2b',
        status: shipmentData.orderType === 'hub' ? 'Active' : 'pending',
        baseAmount,
        markupAmount,
        markupType,
        markupValue,
        totalAmount: computedTotalAmount,
        assignedTo,
        assignedHubId,
        assignedFranchiseId,
        assignedStaffId: shipmentData.assignedStaffId,
      });

      // Call Delhivery LTL API
      try {
        const delhiveryResult = await callDelhiveryLtlApi(shipment);
        if (delhiveryResult.success) {
          shipment.delhiveryResponse = delhiveryResult.data;
          if (delhiveryResult.data?.lrn) {
            shipment.lrn = delhiveryResult.data.lrn;
          }
          if (delhiveryResult.data?.waybill) {
            shipment.waybill = delhiveryResult.data.waybill;
          }
          await shipment.save();
        } else {
          shipment.delhiveryResponse = { error: delhiveryResult.error };
          await shipment.save();
        }
      } catch (apiError: any) {
        shipment.delhiveryResponse = { error: apiError.message };
        await shipment.save();
      }

      // Also create in Shipment table so assigned hub/franchise can see in their orders
      try {
        const dropoff = shipmentData.dropoff_location;
        await Shipment.create({
          userId,
          orderId: shipment.orderId,
          waybill: shipment.waybill,
          name: dropoff.consignee_name,
          add: dropoff.address,
          pin: dropoff.zip,
          city: dropoff.city,
          state: dropoff.state,
          country: 'India',
          phone: dropoff.phone,
          order: shipment.orderId,
          paymentMode: shipmentData.payment_mode === 'cod' ? 'COD' : 'Prepaid',
          fromName: shipmentData.billing_address.name,
          fromAdd: shipmentData.billing_address.address,
          fromPin: shipmentData.billing_address.pin,
          fromCity: shipmentData.billing_address.city,
          fromState: shipmentData.billing_address.state,
          fromCountry: 'India',
          fromPhone: shipmentData.billing_address.phone,
          productsDesc: shipmentData.shipment_details?.[0]?.description || 'LTL Shipment',
          codAmount: shipmentData.cod_amount ? String(shipmentData.cod_amount) : undefined,
          totalAmount: computedTotalAmount ? String(computedTotalAmount) : undefined,
          weight: String(shipmentData.weight),
          quantity: String(shipmentData.shipment_details?.reduce((sum, s) => sum + s.box_count, 0) || 1),
          shippingMode: 'Surface',
          pickupLocation: {
            name: shipmentData.pickup_location_name,
          },
          orderType: shipmentData.orderType || 'b2b',
          status: shipmentData.orderType === 'hub' ? 'Active' : 'pending',
          baseAmount,
          markupAmount,
          markupType,
          markupValue,
          assignedHubId,
          assignedStaffId: shipmentData.assignedStaffId,
          delhiveryResponse: shipment.delhiveryResponse,
          trackingUrl: shipment.trackingUrl,
        });
      } catch (shipmentErr: any) {
        console.error('Failed to create Shipment record for LTL order:', shipmentErr.message);
      }

      return {
        success: true,
        data: {
          orderId: shipment.orderId,
          lrn: shipment.lrn,
          waybill: shipment.waybill,
          status: shipment.status,
          orderType: shipment.orderType,
          baseAmount: shipment.baseAmount,
          markupAmount: shipment.markupAmount,
          markupType: shipment.markupType,
          markupValue: shipment.markupValue,
          totalAmount: shipment.totalAmount,
          assignedTo: shipment.assignedTo,
          assignedHubId: shipment.assignedHubId,
          assignedFranchiseId: shipment.assignedFranchiseId,
          assignedDetails,
          delhiveryResponse: shipment.delhiveryResponse,
        },
      };
    } catch (error: any) {
      throw error;
    }
  },

  async getShipment(orderId: string, userId: string, isAdmin: boolean, hubId?: string) {
    let shipment;
    if (isAdmin) {
      shipment = await LtlShipment.findOne({ orderId }).lean();
    } else if (hubId) {
      shipment = await LtlShipment.findOne({ orderId, assignedHubId: hubId }).lean();
    } else {
      shipment = await LtlShipment.findOne({ orderId, userId }).lean();
    }

    if (!shipment) {
      return { success: false, message: 'LTL Shipment not found' };
    }

    // Fetch assigned hub/franchise details
    const assignedDetails = await resolveAssignedDetails(shipment);

    return { success: true, data: { ...shipment, assignedDetails } };
  },

  async getShipments(userId: string, page: number, limit: number, status?: string, isAdmin?: boolean, hubId?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (!isAdmin) {
      if (hubId) {
        filter.assignedHubId = hubId;
      } else {
        filter.userId = userId;
      }
    }

    if (status) {
      filter.status = status;
    }

    const [shipments, total] = await Promise.all([
      LtlShipment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LtlShipment.countDocuments(filter),
    ]);

    // Add markupProfit and resolve assigned details
    const shipmentsWithDetails = await Promise.all(
      shipments.map(async (s: any) => {
        const assignedDetails = await resolveAssignedDetails(s);
        return {
          ...s,
          markupProfit: (s.markupAmount || 0) - (s.baseAmount || 0),
          assignedDetails,
        };
      })
    );

    return {
      success: true,
      data: {
        shipments: shipmentsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  },

  async updateShipment(orderId: string, userId: string, data: any, isAdmin: boolean, hubId?: string) {
    let shipment;
    if (isAdmin) {
      shipment = await LtlShipment.findOne({ orderId });
    } else if (hubId) {
      shipment = await LtlShipment.findOne({ orderId, assignedHubId: hubId });
    } else {
      shipment = await LtlShipment.findOne({ orderId, userId });
    }

    if (!shipment) {
      return { success: false, message: 'LTL Shipment not found' };
    }

    // Update allowed fields
    const allowedFields = [
      'pickup_location_name', 'payment_mode', 'cod_amount', 'weight',
      'dropoff_location', 'rov_insurance', 'invoices', 'shipment_details',
      'doc_data', 'doc_file', 'fm_pickup', 'freight_mode', 'billing_address',
      'status', 'baseAmount', 'markupAmount', 'markupType', 'markupValue', 'totalAmount',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (shipment as any)[field] = data[field];
      }
    }

    await shipment.save();

    return { success: true, data: shipment };
  },

  async deleteShipment(orderId: string, userId: string, isAdmin: boolean, hubId?: string) {
    let shipment;
    if (isAdmin) {
      shipment = await LtlShipment.findOne({ orderId });
    } else if (hubId) {
      shipment = await LtlShipment.findOne({ orderId, assignedHubId: hubId });
    } else {
      shipment = await LtlShipment.findOne({ orderId, userId });
    }

    if (!shipment) {
      return { success: false, message: 'LTL Shipment not found' };
    }

    // Soft delete
    shipment.status = 'cancelled';
    await shipment.save();

    return { success: true, message: 'LTL Shipment cancelled successfully' };
  },
};

// Helper: Resolve assigned hub/franchise full details from a shipment record
async function resolveAssignedDetails(shipment: any) {
  if (shipment.assignedTo === 'hub' && shipment.assignedHubId) {
    const hub = await HubModel.findById(shipment.assignedHubId).lean();
    if (hub) {
      return {
        type: 'hub',
        id: hub._id.toString(),
        name: hub.hubName,
        managerName: hub.hubManagerName,
        phone: hub.phoneNo,
        address: hub.address,
        city: hub.city,
        state: hub.state,
        pincode: hub.pincode,
      };
    }
  } else if (shipment.assignedTo === 'franchise' && shipment.assignedFranchiseId) {
    const franchise = await Agency.findById(shipment.assignedFranchiseId).lean();
    if (franchise) {
      return {
        type: 'franchise',
        id: franchise._id.toString(),
        name: franchise.agencyName,
        ownerName: franchise.agencyOwner,
        phone: franchise.phone,
        email: franchise.email,
        address: franchise.address,
        city: franchise.city,
        state: franchise.state,
        pincode: franchise.pincode,
        gstNumber: franchise.gstNumber,
      };
    }
  }
  return null;
}

// Call Delhivery LTL Manifest API
async function callDelhiveryLtlApi(shipment: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const delhiveryLtlUrl = process.env.DELHIVERY_LTL_API_URL || 'https://ltl-clients-api-dev.delhivery.com';
    const delhiveryToken = (process.env.DELHIVERY_LTL_API_TOKEN || process.env.DELHIVERY_API_TOKEN || '').trim();

    if (!delhiveryToken) {
      return { success: false, error: 'Delhivery LTL API token not configured' };
    }

    // Build form data
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('lrn', shipment.lrn || '');
    formData.append('pickup_location_name', shipment.pickup_location_name);
    formData.append('payment_mode', shipment.payment_mode);
    formData.append('cod_amount', String(shipment.cod_amount || 0));
    formData.append('weight', String(shipment.weight));
    formData.append('dropoff_location', JSON.stringify(shipment.dropoff_location));
    formData.append('rov_insurance', String(shipment.rov_insurance));
    formData.append('invoices', JSON.stringify(shipment.invoices || []));
    formData.append('shipment_details', JSON.stringify(shipment.shipment_details));
    formData.append('doc_data', JSON.stringify(shipment.doc_data || []));
    formData.append('fm_pickup', String(shipment.fm_pickup));
    formData.append('freight_mode', shipment.freight_mode);
    formData.append('billing_address', JSON.stringify(shipment.billing_address));

    const response = await axios.post(`${delhiveryLtlUrl}/manifest`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${delhiveryToken}`,
      },
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Delhivery LTL API error:', error?.response?.data || error?.message);
    return { success: false, error: error?.response?.data?.message || error?.message };
  }
}
