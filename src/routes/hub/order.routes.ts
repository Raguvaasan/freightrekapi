import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { hubModule, hubPermission } from '../../config/hubModule';
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
router.use(requireParcelRole('hub'));

/**
 * A direct hub login owns its orders; hub staff are measured against the
 * "Parcel Management" permissions on their HubRole.
 */
const orders = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission(
    { hub: hubPermission(hubModule.parcel_management) },
    action
  );

router.post('/create', orders('write'), validate(createShipmentSchema), createHubOrder);
router.get('/', orders('read'), getHubOrders);
router.get('/track/:waybill', orders('read'), trackHubOrder);
router.get('/:orderId', orders('read'), getHubOrder);
router.put('/:orderId', orders('update'), validate(updateShipmentSchema), updateHubOrder);
router.delete('/:orderId', orders('delete'), deleteHubOrder);

export default router;
