"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionAgencyRole = void 0;
const mongoose_1 = require("mongoose");
const collectionAgencyModulePermissionSchema = new mongoose_1.Schema({
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
}, { _id: false });
const collectionAgencyRoleSchema = new mongoose_1.Schema({
    roleName: { type: String, required: true },
    collectionAgencyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CollectionAgency',
        required: true,
        index: true,
    },
    permissions: { type: [collectionAgencyModulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
}, { timestamps: true });
// Compound index for unique role names per collection agency
collectionAgencyRoleSchema.index({ roleName: 1, collectionAgencyId: 1 }, { unique: true });
exports.CollectionAgencyRole = (0, mongoose_1.model)("CollectionAgencyRole", collectionAgencyRoleSchema);
