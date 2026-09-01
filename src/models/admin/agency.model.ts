import { Schema, model, Types } from 'mongoose';

/**
 * Ownership of the agency. Commission (profitPercentage) is only applicable to
 * a third-party agency — an "Own" agency is company-run, so the whole booking
 * amount belongs to the admin and no commission is kept.
 */
export const AGENCY_TYPES = ['Third Party', 'Own'] as const;
export type AgencyType = (typeof AGENCY_TYPES)[number];

/** Percentages added on top of the transportation charge, per agency */
export const DEFAULT_LOADING_CHARGE_PERCENTAGE = 10;
export const DEFAULT_MISC_CHARGE_PERCENTAGE = 10;

export interface IAgency {
  agencyName: string;
  agencyOwner: string;
  phone: string;
  status: 'Active' | 'Inactive';
  /** Third Party -> commission applies; Own -> no commission */
  type: AgencyType;
  /**
   * The same ownership as `type`, as a boolean for the create/edit form:
   * true = Own, false = Third Party. The two are kept in step on every save,
   * so a caller may send either one.
   */
  agencyType?: boolean;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
  /**
   * Commission: share of a parcel booking total this agency keeps (0-100).
   * The rest is remitted to the admin settlement wallet on every booking.
   * Forced to 0 for an "Own" agency.
   */
  profitPercentage: number;
  /** Loading charge added on top of the transportation charge, as a % */
  loadingChargePercentage: number;
  /** Miscellaneous charge added on top of the transportation charge, as a % */
  miscChargePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const agencySchema = new Schema<IAgency>(
  {
    agencyName: {
      type: String,
      required: [true, 'Agency name is required'],
      trim: true,
    },
    agencyOwner: {
      type: String,
      required: [true, 'Agency owner is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    type: {
      type: String,
      enum: AGENCY_TYPES,
      default: 'Third Party',
    },
    agencyType: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
    profitPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Profit percentage cannot be negative'],
      max: [100, 'Profit percentage cannot exceed 100'],
    },
    loadingChargePercentage: {
      type: Number,
      default: DEFAULT_LOADING_CHARGE_PERCENTAGE,
      min: [0, 'Loading charge percentage cannot be negative'],
      max: [100, 'Loading charge percentage cannot exceed 100'],
    },
    miscChargePercentage: {
      type: Number,
      default: DEFAULT_MISC_CHARGE_PERCENTAGE,
      min: [0, 'Miscellaneous charge percentage cannot be negative'],
      max: [100, 'Miscellaneous charge percentage cannot exceed 100'],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Keep the two spellings of ownership in step, then apply the commission rule.
 *
 * `agencyType` is the boolean the form sends and `type` is the stored wording;
 * whichever one the caller changed drives the other, so neither can drift. The
 * validator rejects a create/update that sends both and disagrees, so by the
 * time this runs there is never a real conflict to resolve.
 */
agencySchema.pre('save', function (this: any) {
  if (this.isModified('agencyType') && !this.isModified('type')) {
    this.type = this.agencyType ? 'Own' : 'Third Party';
  }
  this.agencyType = this.type === 'Own';

  // An "Own" agency never keeps a commission, whatever was sent
  if (this.type === 'Own' && this.profitPercentage !== 0) {
    this.profitPercentage = 0;
  }
});

// Index for faster queries
agencySchema.index({ agencyName: 1 });
agencySchema.index({ status: 1 });
agencySchema.index({ type: 1 });

export const Agency = model<IAgency>('Agency', agencySchema);
