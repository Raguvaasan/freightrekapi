import { Schema, model, Document, Types } from "mongoose";

export interface IHubModulePermission {
  module: string;
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

export interface IHubRole extends Document {
  roleName: string;
  hubId: Types.ObjectId;
  permissions: IHubModulePermission[];
  status: boolean;
}

const hubModulePermissionSchema = new Schema<IHubModulePermission>(
  {
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const hubRoleSchema = new Schema<IHubRole>(
  {
    roleName: { type: String, required: true },
    hubId: {
      type: Schema.Types.ObjectId,
      ref: 'Hub',
      required: true,
      index: true,
    },
    permissions: { type: [hubModulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for unique role names per hub
hubRoleSchema.index({ roleName: 1, hubId: 1 }, { unique: true });

export const HubRole = model<IHubRole>("HubRole", hubRoleSchema);
