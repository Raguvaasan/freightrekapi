import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createLtlShipment,
  getLtlShipment,
  getLtlShipments,
  updateLtlShipment,
  deleteLtlShipment,
} from '../controllers/ltlShipment.controller';
import {
  createLtlShipmentSchema,
  getLtlShipmentsSchema,
  updateLtlShipmentSchema,
} from '../validators/ltlShipment.validator';

const router = Router();

// Create LTL shipment
router.post('/create', authMiddleware, validate(createLtlShipmentSchema), createLtlShipment);

// Get all LTL shipments (paginated)
router.get('/orders', authMiddleware, validate(getLtlShipmentsSchema), getLtlShipments);

// Get single LTL shipment
router.get('/order/:orderId', authMiddleware, getLtlShipment);

// Update LTL shipment
router.put('/order/:orderId', authMiddleware, validate(updateLtlShipmentSchema), updateLtlShipment);

// Delete (cancel) LTL shipment
router.delete('/order/:orderId', authMiddleware, deleteLtlShipment);

export default router;
