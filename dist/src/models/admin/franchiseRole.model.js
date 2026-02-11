"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseRole = void 0;
const mongoose_1 = require("mongoose");
const franchiseModulePermissionSchema = new mongoose_1.Schema({
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
}, { _id: false });
const franchiseRoleSchema = new mongoose_1.Schema({
    roleName: { type: String, required: true },
    franchiseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true,
        index: true
    },
    permissions: { type: [franchiseModulePermissionSchema], required: true },
    status: { type: Boolean, default: true }
}, { timestamps: true });
// Compound index for unique role names per franchise
franchiseRoleSchema.index({ roleName: 1, franchiseId: 1 }, { unique: true });
exports.FranchiseRole = (0, mongoose_1.model)("FranchiseRole", franchiseRoleSchema);
