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
const express_1 = require("express");
const ctrl = __importStar(require("../controllers/delhivery.controller"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const delhivery_validator_1 = require("../validators/delhivery.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Delhivery
 *     description: Delhivery B2C integration endpoints (stubbed)
 */
/**
 * @swagger
 * /delhivery/pincode-serviceability:
 *   post:
 *     summary: Pincode Serviceability
 *     tags: [Delhivery]
 */
router.post("/pincode-serviceability", (0, validate_middleware_1.validate)(delhivery_validator_1.pincodeServiceabilitySchema), ctrl.pincodeServiceability);
/**
 * @swagger
 * /delhivery/fetch-waybill:
 *   post:
 *     summary: Fetch Waybill
 *     tags: [Delhivery]
 */
router.post("/fetch-waybill", (0, validate_middleware_1.validate)(delhivery_validator_1.fetchWaybillSchema), ctrl.fetchWaybill);
/**
 * @swagger
 * /delhivery/shipment/manifest:
 *   post:
 *     summary: Shipment Manifestation
 *     tags: [Delhivery]
 */
router.post("/shipment/manifest", (0, validate_middleware_1.validate)(delhivery_validator_1.shipmentManifestSchema), ctrl.manifestShipment);
/**
 * @swagger
 * /delhivery/shipment/update:
 *   post:
 *     summary: Shipment Updation
 *     tags: [Delhivery]
 */
router.post("/shipment/update", (0, validate_middleware_1.validate)(delhivery_validator_1.shipmentUpdateSchema), ctrl.updateShipment);
/**
 * @swagger
 * /delhivery/shipment/cancel:
 *   post:
 *     summary: Shipment Cancellation
 *     tags: [Delhivery]
 */
router.post("/shipment/cancel", (0, validate_middleware_1.validate)(delhivery_validator_1.shipmentCancelSchema), ctrl.cancelShipment);
/**
 * @swagger
 * /delhivery/ewaybill:
 *   post:
 *     summary: E-waybill Management
 *     tags: [Delhivery]
 */
router.post("/ewaybill", (0, validate_middleware_1.validate)(delhivery_validator_1.ewaybillSchema), ctrl.updateEwaybill);
/**
 * @swagger
 * /delhivery/shipment/track:
 *   post:
 *     summary: Shipment Tracking
 *     tags: [Delhivery]
 */
router.post("/shipment/track", (0, validate_middleware_1.validate)(delhivery_validator_1.shipmentTrackingSchema), ctrl.trackShipment);
/**
 * @swagger
 * /delhivery/shipping-cost:
 *   post:
 *     summary: Calculate Shipping Cost
 *     tags: [Delhivery]
 */
router.post("/shipping-cost", (0, validate_middleware_1.validate)(delhivery_validator_1.shippingCostSchema), ctrl.calculateShippingCost);
/**
 * @swagger
 * /delhivery/label:
 *   post:
 *     summary: Generate Shipping Label
 *     tags: [Delhivery]
 */
router.post("/label", (0, validate_middleware_1.validate)(delhivery_validator_1.labelSchema), ctrl.generateLabel);
/**
 * @swagger
 * /delhivery/pickup:
 *   post:
 *     summary: Pickup Request Creation
 *     tags: [Delhivery]
 */
router.post("/pickup", (0, validate_middleware_1.validate)(delhivery_validator_1.pickupRequestSchema), ctrl.createPickupRequest);
/**
 * @swagger
 * /delhivery/warehouse:
 *   post:
 *     summary: Client Warehouse Creation
 *     tags: [Delhivery]
 */
router.post("/warehouse", (0, validate_middleware_1.validate)(delhivery_validator_1.warehouseCreateSchema), ctrl.createWarehouse);
/**
 * @swagger
 * /delhivery/warehouse/update:
 *   post:
 *     summary: Client Warehouse Updation
 *     tags: [Delhivery]
 */
router.post("/warehouse/update", (0, validate_middleware_1.validate)(delhivery_validator_1.warehouseUpdateSchema), ctrl.updateWarehouse);
/**
 * @swagger
 * /delhivery/webhook:
 *   post:
 *     summary: Webhook Functionality
 *     tags: [Delhivery]
 */
router.post("/webhook", (0, validate_middleware_1.validate)(delhivery_validator_1.webhookConfigSchema), ctrl.configureWebhook);
/**
 * @swagger
 * /delhivery/document:
 *   post:
 *     summary: Download Document API
 *     tags: [Delhivery]
 */
router.post("/document", (0, validate_middleware_1.validate)(delhivery_validator_1.downloadDocumentSchema), ctrl.downloadDocument);
/**
 * @swagger
 * /delhivery/rvp-qc:
 *   post:
 *     summary: RVP QC 3.0
 *     tags: [Delhivery]
 */
router.post("/rvp-qc", (0, validate_middleware_1.validate)(delhivery_validator_1.rvpQcSchema), ctrl.createRvpQc);
/**
 * @swagger
 * /delhivery/ndr:
 *   post:
 *     summary: NDR API
 *     tags: [Delhivery]
 */
router.post("/ndr", (0, validate_middleware_1.validate)(delhivery_validator_1.ndrActionSchema), ctrl.ndrAction);
exports.default = router;
