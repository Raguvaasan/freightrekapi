"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubRole = void 0;
const mongoose_1 = require("mongoose");
const hubModulePermissionSchema = new mongoose_1.Schema({
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
}, { _id: false });
const hubRoleSchema = new mongoose_1.Schema({
    roleName: { type: String, required: true },
    hubId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hub',
        required: true,
        index: true,
    },
    permissions: { type: [hubModulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
}, { timestamps: true });
// Compound index for unique role names per hub
hubRoleSchema.index({ roleName: 1, hubId: 1 }, { unique: true });
exports.HubRole = (0, mongoose_1.model)("HubRole", hubRoleSchema);
