import { Schema, model } from 'mongoose';

export interface IB2bOtp {
  mobileNumber: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
}

const b2bOtpSchema = new Schema<IB2bOtp>({
  mobileNumber: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false },
});

b2bOtpSchema.index({ mobileNumber: 1, used: 1 });
b2bOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const B2bOtp = model<IB2bOtp>('B2bOtp', b2bOtpSchema);
