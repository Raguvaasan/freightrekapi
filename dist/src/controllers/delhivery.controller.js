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
exports.ndrAction = exports.createRvpQc = exports.downloadDocument = exports.configureWebhook = exports.updateWarehouse = exports.createWarehouse = exports.createPickupRequest = exports.generateLabel = exports.calculateShippingCost = exports.trackShipment = exports.updateEwaybill = exports.cancelShipment = exports.updateShipment = exports.manifestShipment = exports.fetchWaybill = exports.pincodeServiceability = void 0;
const svc = __importStar(require("../services/delhivery.service"));
const respond = async (res, fn) => {
    try {
        const result = await fn;
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const pincodeServiceability = (req, res) => respond(res, svc.checkPincodeServiceability(req.body));
exports.pincodeServiceability = pincodeServiceability;
const fetchWaybill = (req, res) => respond(res, svc.fetchWaybill(req.body));
exports.fetchWaybill = fetchWaybill;
const manifestShipment = (req, res) => respond(res, svc.manifestShipment(req.body));
exports.manifestShipment = manifestShipment;
const updateShipment = (req, res) => respond(res, svc.updateShipment(req.body));
exports.updateShipment = updateShipment;
const cancelShipment = (req, res) => respond(res, svc.cancelShipment(req.body));
exports.cancelShipment = cancelShipment;
const updateEwaybill = (req, res) => respond(res, svc.updateEwaybill(req.body));
exports.updateEwaybill = updateEwaybill;
const trackShipment = (req, res) => respond(res, svc.trackShipment(req.body));
exports.trackShipment = trackShipment;
const calculateShippingCost = (req, res) => respond(res, svc.calculateShippingCost(req.body));
exports.calculateShippingCost = calculateShippingCost;
const generateLabel = (req, res) => respond(res, svc.generateLabel(req.body));
exports.generateLabel = generateLabel;
const createPickupRequest = (req, res) => respond(res, svc.createPickupRequest(req.body));
exports.createPickupRequest = createPickupRequest;
const createWarehouse = (req, res) => respond(res, svc.createWarehouse(req.body));
exports.createWarehouse = createWarehouse;
const updateWarehouse = (req, res) => respond(res, svc.updateWarehouse(req.body));
exports.updateWarehouse = updateWarehouse;
const configureWebhook = (req, res) => respond(res, svc.configureWebhook(req.body));
exports.configureWebhook = configureWebhook;
const downloadDocument = (req, res) => respond(res, svc.downloadDocument(req.body));
exports.downloadDocument = downloadDocument;
const createRvpQc = (req, res) => respond(res, svc.createRvpQc(req.body));
exports.createRvpQc = createRvpQc;
const ndrAction = (req, res) => respond(res, svc.ndrAction(req.body));
exports.ndrAction = ndrAction;
