"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHub = exports.updateHub = exports.getHubById = exports.getHubs = exports.loginHub = exports.createHub = void 0;
const hub_model_1 = require("../../models/hub/hub.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const createHub = async (rb) => {
    try {
        const hashedPassword = await bcryptjs_1.default.hash(rb.password, 10);
        const hub = await hub_model_1.HubModel.create({ ...rb, password: hashedPassword });
        return { success: true, data: hub };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.createHub = createHub;
const loginHub = async (username, password) => {
    try {
        const hub = await hub_model_1.HubModel.findOne({ username }).select('+password');
        if (!hub) {
            return { success: false, message: 'Invalid credentials' };
        }
        if (!hub.status) {
            return { success: false, message: 'Hub account is inactive' };
        }
        // Support both bcrypt hashed (new) and plain text (legacy) passwords
        let isPasswordValid = false;
        if (hub.password.startsWith('$2')) {
            isPasswordValid = await bcryptjs_1.default.compare(password, hub.password);
        }
        else {
            isPasswordValid = hub.password === password;
        }
        if (!isPasswordValid) {
            return { success: false, message: 'Invalid credentials' };
        }
        const hubData = hub.toObject();
        delete hubData.password;
        const token = (0, jwt_1.generateToken)(hub._id.toString());
        return { success: true, message: 'Hub login successful', data: { ...hubData, token } };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.loginHub = loginHub;
const getHubs = async () => {
    try {
        const hubs = await hub_model_1.HubModel.find();
        return { success: true, data: hubs };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubs = getHubs;
const getHubById = async (id) => {
    try {
        const hub = await hub_model_1.HubModel.findById(id);
        return { success: true, data: hub };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubById = getHubById;
const updateHub = async (id, rb) => {
    try {
        const hub = await hub_model_1.HubModel.findByIdAndUpdate(id, rb, { new: true });
        if (!hub) {
            return { success: false, message: "Hub not found" };
        }
        return { success: true, data: hub };
    }
    catch (err) {
        return { success: false, data: err.message };
    }
};
exports.updateHub = updateHub;
const deleteHub = async (id) => {
    try {
        const hub = await hub_model_1.HubModel.findByIdAndDelete(id);
        if (!hub) {
            return { success: false, message: "Hub not found" };
        }
        return { success: true, message: "Hub deleted" };
    }
    catch (err) {
        return { success: false, data: err.message };
    }
};
exports.deleteHub = deleteHub;
