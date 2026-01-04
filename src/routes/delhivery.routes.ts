import { Router } from "express";
import * as ctrl from "../controllers/delhivery.controller";
import { validate } from "../middleware/validate.middleware";
import {
  pincodeServiceabilitySchema,
  fetchWaybillSchema,
  shipmentManifestSchema,
  shipmentUpdateSchema,
  shipmentCancelSchema,
  ewaybillSchema,
  shipmentTrackingSchema,
  shippingCostSchema,
  labelSchema,
  pickupRequestSchema,
  warehouseCreateSchema,
  warehouseUpdateSchema,
  webhookConfigSchema,
  downloadDocumentSchema,
  rvpQcSchema,
  ndrActionSchema,
} from "../validators/delhivery.validator";

const router = Router();

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
router.post("/pincode-serviceability", validate(pincodeServiceabilitySchema), ctrl.pincodeServiceability);

/**
 * @swagger
 * /delhivery/fetch-waybill:
 *   post:
 *     summary: Fetch Waybill
 *     tags: [Delhivery]
 */
router.post("/fetch-waybill", validate(fetchWaybillSchema), ctrl.fetchWaybill);

/**
 * @swagger
 * /delhivery/shipment/manifest:
 *   post:
 *     summary: Shipment Manifestation
 *     tags: [Delhivery]
 */
router.post("/shipment/manifest", validate(shipmentManifestSchema), ctrl.manifestShipment);

/**
 * @swagger
 * /delhivery/shipment/update:
 *   post:
 *     summary: Shipment Updation
 *     tags: [Delhivery]
 */
router.post("/shipment/update", validate(shipmentUpdateSchema), ctrl.updateShipment);

/**
 * @swagger
 * /delhivery/shipment/cancel:
 *   post:
 *     summary: Shipment Cancellation
 *     tags: [Delhivery]
 */
router.post("/shipment/cancel", validate(shipmentCancelSchema), ctrl.cancelShipment);

/**
 * @swagger
 * /delhivery/ewaybill:
 *   post:
 *     summary: E-waybill Management
 *     tags: [Delhivery]
 */
router.post("/ewaybill", validate(ewaybillSchema), ctrl.updateEwaybill);

/**
 * @swagger
 * /delhivery/shipment/track:
 *   post:
 *     summary: Shipment Tracking
 *     tags: [Delhivery]
 */
router.post("/shipment/track", validate(shipmentTrackingSchema), ctrl.trackShipment);

/**
 * @swagger
 * /delhivery/shipping-cost:
 *   post:
 *     summary: Calculate Shipping Cost
 *     tags: [Delhivery]
 */
router.post("/shipping-cost", validate(shippingCostSchema), ctrl.calculateShippingCost);

/**
 * @swagger
 * /delhivery/label:
 *   post:
 *     summary: Generate Shipping Label
 *     tags: [Delhivery]
 */
router.post("/label", validate(labelSchema), ctrl.generateLabel);

/**
 * @swagger
 * /delhivery/pickup:
 *   post:
 *     summary: Pickup Request Creation
 *     tags: [Delhivery]
 */
router.post("/pickup", validate(pickupRequestSchema), ctrl.createPickupRequest);

/**
 * @swagger
 * /delhivery/warehouse:
 *   post:
 *     summary: Client Warehouse Creation
 *     tags: [Delhivery]
 */
router.post("/warehouse", validate(warehouseCreateSchema), ctrl.createWarehouse);

/**
 * @swagger
 * /delhivery/warehouse/update:
 *   post:
 *     summary: Client Warehouse Updation
 *     tags: [Delhivery]
 */
router.post("/warehouse/update", validate(warehouseUpdateSchema), ctrl.updateWarehouse);

/**
 * @swagger
 * /delhivery/webhook:
 *   post:
 *     summary: Webhook Functionality
 *     tags: [Delhivery]
 */
router.post("/webhook", validate(webhookConfigSchema), ctrl.configureWebhook);

/**
 * @swagger
 * /delhivery/document:
 *   post:
 *     summary: Download Document API
 *     tags: [Delhivery]
 */
router.post("/document", validate(downloadDocumentSchema), ctrl.downloadDocument);

/**
 * @swagger
 * /delhivery/rvp-qc:
 *   post:
 *     summary: RVP QC 3.0
 *     tags: [Delhivery]
 */
router.post("/rvp-qc", validate(rvpQcSchema), ctrl.createRvpQc);

/**
 * @swagger
 * /delhivery/ndr:
 *   post:
 *     summary: NDR API
 *     tags: [Delhivery]
 */
router.post("/ndr", validate(ndrActionSchema), ctrl.ndrAction);

export default router;
