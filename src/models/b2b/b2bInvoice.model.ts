import { Schema, model, Types } from 'mongoose';

interface IB2bInvoiceParty {
  name?: string;
  mobileNumber?: string;
  address?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
}

export interface IB2bInvoice {
  invoiceNumber: string;
  order: Types.ObjectId;
  orderNumber: string;
  b2bUserId: Types.ObjectId;
  invoiceDate: Date;
  billTo: IB2bInvoiceParty;
  shipTo: IB2bInvoiceParty;
  pickupAddress?: string;
  deliveryAddress?: string;
  lrNo?: string;
  waybill?: string;
  orderStatus?: string;
  shipment: { approximateWeight?: number };
  driver?: { driverName?: string; phoneNumber?: string; licenseNumber?: string };
  vehicle?: {
    vehicleType?: string;
    registrationNumber?: string;
    insuranceNumber?: string;
    rcNumber?: string;
    capacityKg?: number;
    ratePerKm?: number;
    status?: string;
  };
  charges: { transportationCharge: number; totalAmount: number };
  status: 'issued' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<IB2bInvoiceParty>(
  {
    name: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const b2bInvoiceSchema = new Schema<IB2bInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    order: { type: Schema.Types.ObjectId, ref: 'B2bOrder', required: true, unique: true },
    orderNumber: { type: String, required: true, trim: true },
    b2bUserId: { type: Schema.Types.ObjectId, ref: 'B2bUser', required: true, index: true },
    invoiceDate: { type: Date, default: Date.now },
    billTo: { type: partySchema, default: () => ({}) },
    shipTo: { type: partySchema, default: () => ({}) },
    pickupAddress: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    lrNo: { type: String, trim: true, uppercase: true },
    waybill: { type: String, trim: true, uppercase: true },
    orderStatus: { type: String, trim: true },
    shipment: {
      approximateWeight: { type: Number, min: 0 },
    },
    driver: {
      driverName: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
      licenseNumber: { type: String, trim: true, uppercase: true },
    },
    vehicle: {
      vehicleType: { type: String, trim: true },
      registrationNumber: { type: String, trim: true, uppercase: true },
      insuranceNumber: { type: String, trim: true, uppercase: true },
      rcNumber: { type: String, trim: true, uppercase: true },
      capacityKg: { type: Number, min: 0 },
      ratePerKm: { type: Number, min: 0 },
      status: { type: String, trim: true },
    },
    charges: {
      transportationCharge: { type: Number, required: true, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
  },
  { timestamps: true }
);

export const B2bInvoice = model<IB2bInvoice>('B2bInvoice', b2bInvoiceSchema);
