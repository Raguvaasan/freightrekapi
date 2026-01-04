"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHub = exports.updateHub = exports.getHubById = exports.getHubs = exports.createHub = void 0;
const hub_model_1 = require("../../models/hub/hub.model");
const createHub = async (rb) => {
    try {
        const hub = await hub_model_1.HubModel.create(rb);
        return { success: true, data: hub };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.createHub = createHub;
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
