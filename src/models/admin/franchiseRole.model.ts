import { Schema, model, Document, Types } from "mongoose";

export interface IFranchiseModulePermission {
  module: string; 
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

export interface IFranchiseRole extends Document {
  roleName: string;
  franchiseId: Types.ObjectId; // Reference to Agency
  permissions: IFranchiseModulePermission[];
  status: boolean;
}

const franchiseModulePermissionSchema = new Schema<IFranchiseModulePermission>(
  {
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const franchiseRoleSchema = new Schema<IFranchiseRole>(
  {
    roleName: { type: String, required: true },
    franchiseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Agency', 
      required: true,
      index: true 
    },
    permissions: { type: [franchiseModulePermissionSchema], required: true },
    status: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for unique role names per franchise
franchiseRoleSchema.index({ roleName: 1, franchiseId: 1 }, { unique: true });

export const FranchiseRole = model<IFranchiseRole>("FranchiseRole", franchiseRoleSchema);
