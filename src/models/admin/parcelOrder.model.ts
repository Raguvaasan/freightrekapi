import { Schema, model, Types } from 'mongoose';

// Parcel lifecycle statuses (in workflow order).
// Booking agency -> admin assigns hub -> hub processes -> destination agency delivers.
//
// NAMING: what used to be called a "branch" is now an "agency" throughout the
// API. The stored fields are `agency` and `deliveryCustomer.deliveryAgency`;
// the old `branch` / `deliveryBranch` names are still accepted on input and
// mirrored on output for the existing frontend (see toAgencyResponse).
export const PARCEL_STATUSES = [
  'Order Created',
  'Parcel Collected',
  'Hub Assigned',
  'Parcel Dispatched',
  'Parcel Arrived at Hub',
  'Parcel Processed at Hub',
  'Parcel Dispatched from Hub',
  'Parcel Arrived at Branch',
  'Parcel Received at Branch',
  'Delivered',
] as const;
export type ParcelStatus = (typeof PARCEL_STATUSES)[number];

// Who may set which status. Admin can set any status (full override).
// 'branch' is the pre-rename spelling of 'agency', still readable in old
// statusHistory rows.
export type ParcelActorRole = 'admin' | 'agency' | 'hub';
export const ACTOR_ROLES_STORED = ['admin', 'agency', 'branch', 'hub'] as const;

/**
 * The status values are stored as-is (renaming them would rewrite every
 * order's history), so this maps them to the current "Agency" wording for
 * display. Responses carry it as `statusLabel`.
 */
export const statusLabel = (status?: string): string | undefined =>
  status?.replace(/\bBranch\b/g, 'Agency');

// Booking agency (origin) stages
export const ORIGIN_AGENCY_STATUSES: ParcelStatus[] = [
  'Parcel Collected',
  'Parcel Dispatched',
];

// Delivery agency (destination) stages
export const DESTINATION_AGENCY_STATUSES: ParcelStatus[] = [
  'Parcel Arrived at Branch',
  'Parcel Received at Branch',
  'Delivered',
];

export const AGENCY_ALLOWED_STATUSES: ParcelStatus[] = [
  ...ORIGIN_AGENCY_STATUSES,
  ...DESTINATION_AGENCY_STATUSES,
];

export const HUB_ALLOWED_STATUSES: ParcelStatus[] = [
  'Parcel Arrived at Hub',
  'Parcel Processed at Hub',
  'Parcel Dispatched from Hub',
];

// Statuses that cannot be reached before a hub has been assigned
export const HUB_DEPENDENT_STATUSES: ParcelStatus[] = [
  'Parcel Arrived at Hub',
  'Parcel Processed at Hub',
  'Parcel Dispatched from Hub',
];

export const statusIndex = (status: ParcelStatus): number =>
  PARCEL_STATUSES.indexOf(status);

/** The stages between two points of the lifecycle, `from` included, `to` not */
const stagesBetween = (from: ParcelStatus, to: ParcelStatus): ParcelStatus[] =>
  PARCEL_STATUSES.slice(statusIndex(from), statusIndex(to)) as ParcelStatus[];

// ---------------------------------------------------------- dashboard buckets
// Derived from the lifecycle order above rather than listed again, so inserting
// a stage cannot leave a dashboard counting the wrong set.

/** Left the booking agency and not yet delivered */
export const IN_TRANSIT_STATUSES: ParcelStatus[] = stagesBetween(
  'Parcel Dispatched',
  'Delivered'
);

/** Assigned to a hub, which has not dispatched it onward yet */
export const HUB_PENDING_STATUSES: ParcelStatus[] = stagesBetween(
  'Hub Assigned',
  'Parcel Dispatched from Hub'
);

/** Dispatched onward by the hub and not yet delivered */
export const HUB_IN_TRANSIT_STATUSES: ParcelStatus[] = stagesBetween(
  'Parcel Dispatched from Hub',
  'Delivered'
);

/**
 * An inward parcel is one addressed to an agency that it has not handed over
 * yet — a delivered parcel drops off the inward list.
 */
export const INWARD_PENDING_STATUSES: ParcelStatus[] = stagesBetween(
  'Order Created',
  'Delivered'
);

export const PAYMENT_TYPES = ['Paid', 'To Pay', 'Credit'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const WALLET_SETTLEMENT_STATUSES = [
  'settled',
  'reversed',
  'unsettled',
] as const;
export type WalletSettlementStatus = (typeof WALLET_SETTLEMENT_STATUSES)[number];

/**
 * Snapshot of the wallet settlement for this booking, denormalised onto the
 * order so a list screen can show the split without a second lookup. The
 * authoritative record (with its wallet transaction ids) is ParcelSettlement.
 */
export interface IWalletSettlement {
  status: WalletSettlementStatus;
  /** Booking amount that was split (the transportation charge) */
  orderAmount: number;
  /** Agency commission percentage applied at booking time */
  profitPercentage: number;
  /** Commission owed to the agency, paid out separately (not via the wallet) */
  agencyProfitAmount: number;
  /** Booking value net of the agency commission */
  adminShareAmount: number;
  /** Debited from the agency wallet and credited to the admin wallet */
  walletDebitAmount: number;
  settledAt?: Date;
}

interface IStatusHistory {
  status: ParcelStatus;
  note?: string;
  updatedBy?: string;
  updatedByRole?: ParcelActorRole;
  updatedByName?: string;
  updatedAt: Date;
}

export interface IParcelOrder {
  orderNumber: string;
  // Booking agency (was: branch)
  agency: Types.ObjectId;

  // Booking customer
  bookingCustomer: {
    name: string;
    mobileNumber: string;
    address?: string;
    gstNumber?: string;
  };
  paymentType: PaymentType;

  // Delivery customer. deliveryAgency is the destination agency, picked from
  // the available-agencies dropdown.
  deliveryCustomer: {
    name: string;
    mobileNumber: string;
    address?: string;
    gstNumber?: string;
    /**
     * Destination agency. Optional: a booking may be taken before the
     * delivering agency is known, and set later from the update endpoint.
     */
    deliveryAgency?: Types.ObjectId;
  };

  /**
   * Where the parcel is physically collected and dropped.
   *
   * Separate from the customers' own `address` fields on purpose: a booking is
   * often picked up from a warehouse or shop and delivered somewhere other than
   * the consignee's registered address.
   */
  pickupAddress?: string;
  deliveryAddress?: string;

  // Parcel details
  parcelDetails: {
    article: string;
    remarks?: string;
    numberOfParcels: number;
    approximateValue?: number;
  };

  /** Carrier waybill / AWB number written on the consignment note */
  waybill?: string;
  /**
   * Vehicle booked for the movement, as typed on the booking form.
   *
   * Kept as free text next to the `vehicle` reference below: at booking time
   * the agency states the class of vehicle and its capacity, while the actual
   * Vehicle record is only picked once the hub assigns one.
   */
  vehicleType?: string;
  vehicleCapacity?: string;

  /** Base charge the agency quotes */
  transportationCharge: number;
  /** Loading + miscellaneous are derived from the base charge on every change */
  loadingChargePercentage: number;
  loadingCharge: number;
  miscChargePercentage: number;
  miscellaneousCharge: number;
  /** transportationCharge + loadingCharge + miscellaneousCharge */
  totalAmount: number;

  // Hub assignment (done by admin after the branch books the order)
  hub?: Types.ObjectId;
  hubAssignedAt?: Date;
  hubAssignedBy?: string;

  // Dispatch assignment (done by the hub, or by admin)
  vehicle?: Types.ObjectId;
  driver?: Types.ObjectId;
  dispatchAssignedAt?: Date;
  dispatchAssignedBy?: string;

  status: ParcelStatus;
  statusHistory: IStatusHistory[];

  /** Wallet split between the booking branch and the admin */
  walletSettlement?: IWalletSettlement;

  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, enum: PARCEL_STATUSES, required: true },
    note: { type: String, trim: true },
    updatedBy: { type: String },
    updatedByRole: { type: String, enum: ACTOR_ROLES_STORED },
    updatedByName: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const walletSettlementSchema = new Schema<IWalletSettlement>(
  {
    status: {
      type: String,
      enum: WALLET_SETTLEMENT_STATUSES,
      default: 'unsettled',
    },
    orderAmount: { type: Number, default: 0, min: 0 },
    profitPercentage: { type: Number, default: 0, min: 0, max: 100 },
    agencyProfitAmount: { type: Number, default: 0, min: 0 },
    adminShareAmount: { type: Number, default: 0, min: 0 },
    walletDebitAmount: { type: Number, default: 0, min: 0 },
    settledAt: { type: Date },
  },
  { _id: false }
);

const parcelOrderSchema = new Schema<IParcelOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency is required'],
    },

    bookingCustomer: {
      name: {
        type: String,
        required: [true, 'Booking customer name is required'],
        trim: true,
      },
      mobileNumber: {
        type: String,
        required: [true, 'Booking customer mobile number is required'],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
    },
    paymentType: {
      type: String,
      enum: PAYMENT_TYPES,
      required: [true, 'Payment type is required'],
    },

    deliveryCustomer: {
      name: {
        type: String,
        required: [true, 'Delivery customer name is required'],
        trim: true,
      },
      mobileNumber: {
        type: String,
        required: [true, 'Delivery customer mobile number is required'],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      deliveryAgency: {
        type: Schema.Types.ObjectId,
        ref: 'Agency',
      },
    },

    pickupAddress: {
      type: String,
      trim: true,
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },

    parcelDetails: {
      article: {
        type: String,
        required: [true, 'Article is required'],
        trim: true,
      },
      remarks: {
        type: String,
        trim: true,
      },
      numberOfParcels: {
        type: Number,
        required: [true, 'Number of parcels is required'],
        min: [1, 'Number of parcels must be at least 1'],
      },
      approximateValue: {
        type: Number,
        min: [0, 'Approximate value cannot be negative'],
        default: 0,
      },
    },

    waybill: {
      type: String,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    vehicleCapacity: {
      type: String,
      trim: true,
    },

    transportationCharge: {
      type: Number,
      default: 0,
      min: [0, 'Transportation charge cannot be negative'],
    },
    loadingChargePercentage: {
      type: Number,
      default: 0,
      min: [0, 'Loading charge percentage cannot be negative'],
    },
    loadingCharge: {
      type: Number,
      default: 0,
      min: [0, 'Loading charge cannot be negative'],
    },
    miscChargePercentage: {
      type: Number,
      default: 0,
      min: [0, 'Miscellaneous charge percentage cannot be negative'],
    },
    miscellaneousCharge: {
      type: Number,
      default: 0,
      min: [0, 'Miscellaneous charge cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },

    hub: {
      type: Schema.Types.ObjectId,
      ref: 'Hub',
    },
    hubAssignedAt: {
      type: Date,
    },
    hubAssignedBy: {
      type: String,
    },

    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    dispatchAssignedAt: {
      type: Date,
    },
    dispatchAssignedBy: {
      type: String,
    },

    status: {
      type: String,
      enum: PARCEL_STATUSES,
      default: 'Order Created',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    walletSettlement: {
      type: walletSettlementSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

parcelOrderSchema.index({ status: 1 });
parcelOrderSchema.index({ agency: 1 });
parcelOrderSchema.index({ hub: 1 });
parcelOrderSchema.index({ 'deliveryCustomer.deliveryAgency': 1 });
parcelOrderSchema.index({ createdAt: -1 });
// Waybill lookups; sparse because it is optional and often not filled in
parcelOrderSchema.index({ waybill: 1 }, { sparse: true });
// Outward / inward registers: one agency's movements, newest first
parcelOrderSchema.index({ agency: 1, createdAt: -1 });
parcelOrderSchema.index({ 'deliveryCustomer.deliveryAgency': 1, createdAt: -1 });
// Customer Management: one customer's bookings, newest first. The mobile number
// is what identifies a booking customer — see BookingCustomerService.
parcelOrderSchema.index({ 'bookingCustomer.mobileNumber': 1, createdAt: -1 });

export const ParcelOrder = model<IParcelOrder>('ParcelOrder', parcelOrderSchema);

/**
 * Shape a parcel order for the API.
 *
 * `agency` / `deliveryAgency` are the current names. The old `branch` /
 * `deliveryBranch` keys are mirrored alongside them so the existing frontend
 * keeps working; they are deprecated and can be dropped once it has moved
 * over. Also adds display labels that say "Agency" instead of "Branch".
 */
export const toParcelOrderResponse = (order: any): any => {
  if (!order) return order;

  const plain = typeof order.toObject === 'function' ? order.toObject() : { ...order };

  const delivery = plain.deliveryCustomer
    ? {
        ...plain.deliveryCustomer,
        // deprecated mirror
        deliveryBranch: plain.deliveryCustomer.deliveryAgency,
      }
    : plain.deliveryCustomer;

  return {
    ...plain,
    // deprecated mirror
    branch: plain.agency,
    deliveryCustomer: delivery,
    statusLabel: statusLabel(plain.status),
    statusHistory: Array.isArray(plain.statusHistory)
      ? plain.statusHistory.map((entry: any) => ({
          ...entry,
          statusLabel: statusLabel(entry.status),
          // old rows recorded the actor as 'branch'
          updatedByRole: entry.updatedByRole === 'branch' ? 'agency' : entry.updatedByRole,
        }))
      : plain.statusHistory,
  };
};
