import { Schema, model } from 'mongoose';

export interface IOtp {
  phone: string;
  countryCode: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  userType: 'customer' | 'franchise' | 'staff' | 'collection_agency';
}

const otpSchema = new Schema<IOtp>({
  phone: { type: String, required: true },
  countryCode: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  userType: { type: String, enum: ['customer', 'franchise', 'staff', 'collection_agency'], default: 'customer' },
});

// Fast lookup for OTP verification (every login/register hits this)
otpSchema.index({ phone: 1, countryCode: 1, used: 1, userType: 1 });

// Auto-delete document from MongoDB after it expires
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model<IOtp>('Otp', otpSchema);
