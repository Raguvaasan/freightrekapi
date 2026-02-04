import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createShipment,
  getShipment,
  getShipments,
  trackShipment,
} from '../controllers/shipment.controller';
import { createShipmentSchema, getShipmentsSchema } from '../validators/shipment.validator';

const router = Router();

// All routes require authentication
router.post('/create', authMiddleware, validate(createShipmentSchema), createShipment);

router.get('/orders', authMiddleware, validate(getShipmentsSchema), getShipments);

router.get('/order/:orderId', authMiddleware, getShipment);

router.get('/track/:waybill', authMiddleware, trackShipment);

export default router;
