"use strict";
// Placeholder service for Delhivery B2C APIs
// Replace stubbed responses with actual HTTP calls to Delhivery endpoints.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ndrAction = exports.createRvpQc = exports.downloadDocument = exports.configureWebhook = exports.updateWarehouse = exports.createWarehouse = exports.createPickupRequest = exports.generateLabel = exports.calculateShippingCost = exports.trackShipment = exports.updateEwaybill = exports.cancelShipment = exports.updateShipment = exports.manifestShipment = exports.fetchWaybill = exports.checkPincodeServiceability = void 0;
const stub = async (name, payload) => {
    return {
        success: true,
        data: { note: `${name} stubbed`, payload },
        message: "Replace stub with real Delhivery API integration",
    };
};
const checkPincodeServiceability = (payload) => stub("pincodeServiceability", payload);
exports.checkPincodeServiceability = checkPincodeServiceability;
const fetchWaybill = (payload) => stub("fetchWaybill", payload);
exports.fetchWaybill = fetchWaybill;
const manifestShipment = (payload) => stub("manifestShipment", payload);
exports.manifestShipment = manifestShipment;
const updateShipment = (payload) => stub("updateShipment", payload);
exports.updateShipment = updateShipment;
const cancelShipment = (payload) => stub("cancelShipment", payload);
exports.cancelShipment = cancelShipment;
const updateEwaybill = (payload) => stub("updateEwaybill", payload);
exports.updateEwaybill = updateEwaybill;
const trackShipment = (payload) => stub("trackShipment", payload);
exports.trackShipment = trackShipment;
const calculateShippingCost = (payload) => stub("calculateShippingCost", payload);
exports.calculateShippingCost = calculateShippingCost;
const generateLabel = (payload) => stub("generateLabel", payload);
exports.generateLabel = generateLabel;
const createPickupRequest = (payload) => stub("createPickupRequest", payload);
exports.createPickupRequest = createPickupRequest;
const createWarehouse = (payload) => stub("createWarehouse", payload);
exports.createWarehouse = createWarehouse;
const updateWarehouse = (payload) => stub("updateWarehouse", payload);
exports.updateWarehouse = updateWarehouse;
const configureWebhook = (payload) => stub("configureWebhook", payload);
exports.configureWebhook = configureWebhook;
const downloadDocument = (payload) => stub("downloadDocument", payload);
exports.downloadDocument = downloadDocument;
const createRvpQc = (payload) => stub("createRvpQc", payload);
exports.createRvpQc = createRvpQc;
const ndrAction = (payload) => stub("ndrAction", payload);
exports.ndrAction = ndrAction;
