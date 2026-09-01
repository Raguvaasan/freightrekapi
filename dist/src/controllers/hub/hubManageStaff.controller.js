"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHubStaffStatus = exports.deleteHubStaff = exports.updateHubStaff = exports.createHubStaff = exports.getHubStaffById = exports.getHubStaff = void 0;
const hubManageStaffService = __importStar(require("../../services/hub/hubManageStaff.service"));
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * The hub whose staff these are. A direct hub login is the hub; a hub staff
 * member has an id of their own, so the hub is read off their record.
 */
const hubOf = (req) => req.parcelActor?.hubId
    ? Promise.resolve(req.parcelActor.hubId)
    : (0, parcelActor_1.resolveHubId)(req.user?.id);
const getHubStaff = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const result = await hubManageStaffService.getHubStaff(hubId, page, limit, search);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getHubStaff = getHubStaff;
const getHubStaffById = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubManageStaffService.getHubStaffById(hubId, req.params.id);
        if (!result.success) {
            const status = result.message === 'Staff not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getHubStaffById = getHubStaffById;
const createHubStaff = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubManageStaffService.createHubStaff(hubId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createHubStaff = createHubStaff;
const updateHubStaff = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubManageStaffService.updateHubStaff(hubId, req.params.id, req.body);
        if (!result.success) {
            const status = result.message === 'Staff not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateHubStaff = updateHubStaff;
const deleteHubStaff = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubManageStaffService.deleteHubStaff(hubId, req.params.id);
        if (!result.success) {
            const status = result.message === 'Staff not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteHubStaff = deleteHubStaff;
const updateHubStaffStatus = async (req, res) => {
    try {
        const hubId = await hubOf(req);
        if (!hubId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { status } = req.body;
        if (!status || !['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be Active or Inactive' });
        }
        const result = await hubManageStaffService.updateHubStaffStatus(hubId, req.params.id, status);
        if (!result.success) {
            const status404 = result.message === 'Staff not found' ? 404 : 400;
            return res.status(status404).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateHubStaffStatus = updateHubStaffStatus;
