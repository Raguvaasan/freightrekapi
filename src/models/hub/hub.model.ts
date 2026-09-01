import { Schema, model, Types } from "mongoose";

export interface IHub {
  hubName: string;
  hubManagerName: string;
  phoneNo: number;
  address: string;
  city: string;
  state: string;
  pincode: number;
  status: boolean;
  /**
   * Optional. A hub signs in by phone OTP, so a hub created today has no
   * credentials; these back the older POST /admin/hub/login only.
   */
  username?: string;
  password?: string;
}

const hubSchema = new Schema<IHub>(
  {
    hubName: {
      type: String,
      required: true,
      trim: true,
    },
    hubManagerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNo: {
      type: Number,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: Number,
      required: true,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    username: {
      // `sparse` matters: without it every credential-less hub would store
      // username: null and the second one would collide on the unique index
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

export const HubModel = model<IHub>("Hub", hubSchema);
