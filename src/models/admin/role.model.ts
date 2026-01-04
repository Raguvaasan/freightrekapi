import { Schema, model, Document } from "mongoose";

export interface IModulePermission {
  module: string; 
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

export interface IRole extends Document {
  roleName: string;
  permissions: IModulePermission[];
  status: boolean;
  isRoot: boolean;
}

const modulePermissionSchema = new Schema<IModulePermission>(
  {
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new Schema<IRole>(
  {
    roleName: { type: String, required: true, unique: true },
    permissions: { type: [modulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
    isRoot: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Role = model<IRole>("AdminRole", roleSchema);
