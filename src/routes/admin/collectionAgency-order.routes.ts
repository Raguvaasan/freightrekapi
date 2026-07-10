import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createShipmentSchema, updateShipmentSchema } from '../../validators/shipment.validator';
import {
  createCollectionAgencyOrder,
  getCollectionAgencyOrders,
  getCollectionAgencyOrder,
  updateCollectionAgencyOrder,
  deleteCollectionAgencyOrder,
  trackCollectionAgencyOrder,
} from '../../controllers/admin/collectionAgency-order.controller';

const router = Router();

// All routes require collection agency (or collection agency staff) JWT
router.use(authMiddleware);

router.post('/create', validate(createShipmentSchema), createCollectionAgencyOrder);
router.get('/', getCollectionAgencyOrders);
router.get('/track/:waybill', trackCollectionAgencyOrder);
router.get('/:orderId', getCollectionAgencyOrder);
router.put('/:orderId', validate(updateShipmentSchema), updateCollectionAgencyOrder);
router.delete('/:orderId', deleteCollectionAgencyOrder);

export default router;
