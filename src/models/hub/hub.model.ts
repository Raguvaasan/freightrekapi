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
  username: string;
  password: string;
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
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const HubModel = model<IHub>("Hub", hubSchema);
