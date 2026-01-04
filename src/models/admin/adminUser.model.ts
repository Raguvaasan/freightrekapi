import { Schema, model, Types } from "mongoose";

export interface IAdminUser {
  name: string;
  email: string;
  phoneNo: string;
  password: string;
  status: boolean;
  roleId: Types.ObjectId;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    phoneNo: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: Boolean,
      default: true,
    },

    roleId: {
      type: Types.ObjectId,
      ref: "AdminRole", 
      required: true,
    },
  },
  { timestamps: true }
);

export const AdminUser = model<IAdminUser>("AdminUser", adminUserSchema);
