import { Schema, model } from 'mongoose';

export interface ILtlInvoice {
  ewaybill?: string;
  inv_num: string;
  inv_amt: number;
  inv_qr_code?: string;
}

export interface ILtlShipmentDetail {
  order_id: string;
  box_count: number;
  description?: string;
  weight: number;
  waybills?: string[];
  master?: boolean;
}

export interface ILtlDocData {
  doc_type: string;
  doc_meta?: Record<string, any>;
}

export interface ILtlDropoffLocation {
  consignee_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email?: string;
}

export interface ILtlBillingAddress {
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
}

export interface ILtlShipment {
  userId: string;
  orderId: string;
  lrn?: string;
  waybill?: string;
  pickup_location_name: string;
  payment_mode: 'cod' | 'prepaid';
  cod_amount?: number;
  weight: number;
  dropoff_location: ILtlDropoffLocation;
  rov_insurance: boolean;
  invoices?: ILtlInvoice[];
  shipment_details: ILtlShipmentDetail[];
  doc_data?: ILtlDocData[];
  doc_file?: string;
  fm_pickup: boolean;
  freight_mode: string;
  billing_address: ILtlBillingAddress;
  // Existing fields from our system
  orderType: 'hub' | 'customer' | 'b2b';
  status: 'pending' | 'created' | 'Active' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  baseAmount?: number;
  markupAmount?: number;
  markupType?: 'percentage' | 'fixed';
  markupValue?: number;
  totalAmount?: number;
  assignedTo?: 'hub' | 'franchise';
  assignedHubId?: string;
  assignedFranchiseId?: string;
  assignedStaffId?: string;
  delhiveryResponse?: any;
  trackingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ltlShipmentSchema = new Schema<ILtlShipment>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lrn: String,
    waybill: {
      type: String,
      index: true,
    },
    pickup_location_name: {
      type: String,
      required: true,
    },
    payment_mode: {
      type: String,
      enum: ['cod', 'prepaid'],
      required: true,
    },
    cod_amount: Number,
    weight: {
      type: Number,
      required: true,
    },
    dropoff_location: {
      consignee_name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    rov_insurance: {
      type: Boolean,
      default: false,
    },
    invoices: [
      {
        ewaybill: String,
        inv_num: { type: String, required: true },
        inv_amt: { type: Number, required: true },
        inv_qr_code: String,
      },
    ],
    shipment_details: [
      {
        order_id: { type: String, required: true },
        box_count: { type: Number, required: true },
        description: String,
        weight: { type: Number, required: true },
        waybills: [String],
        master: { type: Boolean, default: false },
      },
    ],
    doc_data: [
      {
        doc_type: { type: String, required: true },
        doc_meta: { type: Schema.Types.Mixed },
      },
    ],
    doc_file: String,
    fm_pickup: {
      type: Boolean,
      default: false,
    },
    freight_mode: {
      type: String,
      required: true,
    },
    billing_address: {
      name: { type: String, required: true },
      company: { type: String, required: true },
      consignor: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pin: { type: String, required: true },
      phone: { type: String, required: true },
      pan_number: String,
      gst_number: String,
    },
    orderType: {
      type: String,
      enum: ['hub', 'customer', 'b2b'],
      default: 'b2b',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'created', 'Active', 'in_transit', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    baseAmount: Number,
    markupAmount: Number,
    markupType: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    markupValue: Number,
    totalAmount: Number,
    assignedTo: {
      type: String,
      enum: ['hub', 'franchise'],
    },
    assignedHubId: {
      type: String,
      index: true,
    },
    assignedFranchiseId: {
      type: String,
      index: true,
    },
    assignedStaffId: {
      type: String,
      index: true,
    },
    delhiveryResponse: Schema.Types.Mixed,
    trackingUrl: String,
  },
  { timestamps: true }
);

ltlShipmentSchema.index({ userId: 1, createdAt: -1 });
ltlShipmentSchema.index({ userId: 1, status: 1 });

export const LtlShipment = model<ILtlShipment>('LtlShipment', ltlShipmentSchema);
