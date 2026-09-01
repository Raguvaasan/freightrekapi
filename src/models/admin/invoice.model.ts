import { Schema, model, Types } from 'mongoose';
import { PAYMENT_TYPES, PaymentType } from './parcelOrder.model';

export const INVOICE_STATUSES = ['issued', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Party details are snapshotted so a later edit cannot rewrite history */
interface IInvoiceParty {
  name?: string;
  mobileNumber?: string;
  address?: string;
  gstNumber?: string;
  /** Agency the party is attached to (issuing / destination) */
  agencyName?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface IInvoiceCharges {
  transportationCharge: number;
  loadingChargePercentage: number;
  loadingCharge: number;
  miscChargePercentage: number;
  miscellaneousCharge: number;
  totalAmount: number;
}

/**
 * One invoice per parcel order (unique index on `order`), raised automatically
 * when the order is booked. Everything the print layout needs is stored on the
 * document, so an invoice reprints identically even if the agency or customer
 * record changes later.
 */
export interface IInvoice {
  invoiceNumber: string;
  order: Types.ObjectId;
  orderNumber: string;
  /** Booking agency that raised the invoice */
  agency: Types.ObjectId;
  /**
   * Destination agency. Denormalised from the order so the agency delivering a
   * parcel it did not book can still read (and list) the invoice.
   */
  deliveryAgency?: Types.ObjectId;

  invoiceDate: Date;
  /** Snapshot of the issuing agency */
  issuedByAgency: IInvoiceParty;
  /** Booking customer */
  billTo: IInvoiceParty;
  /** Delivery customer + destination agency */
  shipTo: IInvoiceParty;

  /** Where the parcel is collected from / dropped at, as booked */
  pickupAddress?: string;
  deliveryAddress?: string;

  parcelDetails: {
    article?: string;
    remarks?: string;
    numberOfParcels?: number;
    approximateValue?: number;
  };

  /**
   * Carrier waybill / AWB and the vehicle booked for the movement, snapshotted
   * from the order like every other field here so a reprint shows what was on
   * the consignment note even if the order is edited afterwards.
   */
  waybill?: string;
  vehicleType?: string;
  vehicleCapacity?: string;

  charges: IInvoiceCharges;
  paymentType: PaymentType;

  status: InvoiceStatus;
  notes?: string;

  /** Trail of charge revisions after the invoice was raised */
  revisions: {
    previousTotal: number;
    newTotal: number;
    revisedBy?: string;
    note?: string;
    revisedAt: Date;
  }[];

  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<IInvoiceParty>(
  {
    name: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    agencyName: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const chargesSchema = new Schema<IInvoiceCharges>(
  {
    transportationCharge: { type: Number, required: true, min: 0 },
    loadingChargePercentage: { type: Number, default: 0, min: 0 },
    loadingCharge: { type: Number, default: 0, min: 0 },
    miscChargePercentage: { type: Number, default: 0, min: 0 },
    miscellaneousCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const revisionSchema = new Schema(
  {
    previousTotal: { type: Number, required: true },
    newTotal: { type: Number, required: true },
    revisedBy: { type: String },
    note: { type: String, trim: true },
    revisedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'ParcelOrder',
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    deliveryAgency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
    },

    invoiceDate: { type: Date, default: Date.now },
    issuedByAgency: { type: partySchema, default: () => ({}) },
    billTo: { type: partySchema, default: () => ({}) },
    shipTo: { type: partySchema, default: () => ({}) },

    pickupAddress: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },

    parcelDetails: {
      article: { type: String, trim: true },
      remarks: { type: String, trim: true },
      numberOfParcels: { type: Number, min: 0 },
      approximateValue: { type: Number, min: 0 },
    },

    waybill: { type: String, trim: true, uppercase: true },
    vehicleType: { type: String, trim: true },
    vehicleCapacity: { type: String, trim: true },

    charges: { type: chargesSchema, required: true },
    paymentType: { type: String, enum: PAYMENT_TYPES, required: true },

    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'issued',
    },
    notes: { type: String, trim: true },

    revisions: { type: [revisionSchema], default: [] },

    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ agency: 1, invoiceDate: -1 });
invoiceSchema.index({ deliveryAgency: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ orderNumber: 1 });
invoiceSchema.index({ invoiceDate: -1 });

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
