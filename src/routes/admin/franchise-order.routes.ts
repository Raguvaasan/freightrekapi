import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createShipmentSchema, updateShipmentSchema } from '../../validators/shipment.validator';
import {
  createFranchiseOrder,
  getFranchiseOrders,
  getFranchiseOrder,
  updateFranchiseOrder,
  deleteFranchiseOrder,
  trackFranchiseOrder,
} from '../../controllers/admin/franchise-order.controller';

const router = Router();

// All routes require franchise (or franchise staff) JWT
router.use(authMiddleware);

router.post('/create', validate(createShipmentSchema), createFranchiseOrder);
router.get('/', getFranchiseOrders);
router.get('/track/:waybill', trackFranchiseOrder);
router.get('/:orderId', getFranchiseOrder);
router.put('/:orderId', validate(updateShipmentSchema), updateFranchiseOrder);
router.delete('/:orderId', deleteFranchiseOrder);

export default router;
