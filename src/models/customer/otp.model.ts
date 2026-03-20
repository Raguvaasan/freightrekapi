import { Schema, model } from 'mongoose';

export interface IOtp {
  phone: string;
  countryCode: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
}

const otpSchema = new Schema<IOtp>({
  phone: { type: String, required: true },
  countryCode: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

// Auto-delete document from MongoDB after it expires
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model<IOtp>('Otp', otpSchema);
