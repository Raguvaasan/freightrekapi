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
exports.deleteHub = exports.updateHub = exports.gethubById = exports.getHubs = exports.createHub = exports.loginHub = void 0;
const hubService = __importStar(require("../../services/admin/hub.service"));
const loginHub = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await hubService.loginHub(username, password);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.loginHub = loginHub;
const createHub = async (req, res) => {
    try {
        const hub = await hubService.createHub(req.body);
        res.status(201).json({ success: true, data: hub });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createHub = createHub;
const getHubs = async (req, res) => {
    try {
        const hubs = await hubService.getHubs();
        res.status(200).json({ success: true, data: hubs });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.getHubs = getHubs;
const gethubById = async (req, res) => {
    try {
        const id = req.params.id;
        const hub = await hubService.getHubById(id);
        res.status(200).json({ success: true, data: hub });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.gethubById = gethubById;
const updateHub = async (req, res) => {
    try {
        const id = req.params.id;
        const rb = req.body;
        const hub = await hubService.updateHub(id, rb);
        if (!hub) {
            return res.status(404).json({ success: false, message: "Hub not found" });
        }
        res.status(200).json({ success: true, data: hub });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.updateHub = updateHub;
const deleteHub = async (req, res) => {
    try {
        const id = req.params.id;
        const hub = await hubService.deleteHub(id);
        if (!hub) {
            return res.status(404).json({ success: false, message: "Hub not found" });
        }
        res.status(200).json({ success: true, message: "Hub deleted" });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.deleteHub = deleteHub;
