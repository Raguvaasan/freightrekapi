import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createShipment,
  getShipment,
  getShipments,
  getActiveShipments,
  trackShipment,
  updateShipment,
  deleteShipment,
} from '../controllers/shipment.controller';
import { createShipmentSchema, getShipmentsSchema, updateShipmentSchema } from '../validators/shipment.validator';

const router = Router();

// All routes require authentication
router.post('/create', authMiddleware, validate(createShipmentSchema), createShipment);

router.get('/orders', authMiddleware, validate(getShipmentsSchema), getShipments);

router.get('/active', authMiddleware, getActiveShipments);

router.get('/order/:orderId', authMiddleware, getShipment);

router.put('/order/:orderId', authMiddleware, validate(updateShipmentSchema), updateShipment);

router.delete('/order/:orderId', authMiddleware, deleteShipment);

router.get('/track/:waybill', authMiddleware, trackShipment);

export default router;
