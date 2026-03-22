import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createShipmentSchema, updateShipmentSchema } from '../../validators/shipment.validator';
import {
  createHubOrder,
  getHubOrders,
  getHubOrder,
  updateHubOrder,
  deleteHubOrder,
  trackHubOrder,
} from '../../controllers/hub/order.controller';

const router = Router();

// All routes require hub staff JWT
router.use(authMiddleware);

router.post('/create', validate(createShipmentSchema), createHubOrder);
router.get('/', getHubOrders);
router.get('/track/:waybill', trackHubOrder);
router.get('/:orderId', getHubOrder);
router.put('/:orderId', validate(updateShipmentSchema), updateHubOrder);
router.delete('/:orderId', deleteHubOrder);

export default router;
