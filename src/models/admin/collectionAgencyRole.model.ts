import { Schema, model, Document, Types } from "mongoose";

export interface ICollectionAgencyModulePermission {
  module: string;
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

export interface ICollectionAgencyRole extends Document {
  roleName: string;
  collectionAgencyId: Types.ObjectId; // Reference to CollectionAgency
  permissions: ICollectionAgencyModulePermission[];
  status: boolean;
}

const collectionAgencyModulePermissionSchema = new Schema<ICollectionAgencyModulePermission>(
  {
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

const collectionAgencyRoleSchema = new Schema<ICollectionAgencyRole>(
  {
    roleName: { type: String, required: true },
    collectionAgencyId: {
      type: Schema.Types.ObjectId,
      ref: 'CollectionAgency',
      required: true,
      index: true,
    },
    permissions: { type: [collectionAgencyModulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for unique role names per collection agency
collectionAgencyRoleSchema.index({ roleName: 1, collectionAgencyId: 1 }, { unique: true });

export const CollectionAgencyRole = model<ICollectionAgencyRole>(
  "CollectionAgencyRole",
  collectionAgencyRoleSchema
);
