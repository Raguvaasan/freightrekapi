"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const mongoose_1 = require("mongoose");
const modulePermissionSchema = new mongoose_1.Schema({
    module: { type: String, required: true },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
}, { _id: false });
const roleSchema = new mongoose_1.Schema({
    roleName: { type: String, required: true, unique: true },
    permissions: { type: [modulePermissionSchema], required: true },
    status: { type: Boolean, default: true },
    isRoot: { type: Boolean, default: false }
}, { timestamps: true });
exports.Role = (0, mongoose_1.model)("AdminRole", roleSchema);
