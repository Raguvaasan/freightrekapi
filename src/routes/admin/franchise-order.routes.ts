import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';
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
router.use(requireParcelRole('agency'));

/**
 * A direct agency login owns its orders; agency staff are measured against the
 * "Parcel Management" permissions on their FranchiseRole.
 */
const orders = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission(
    { agency: agencyPermission(agencyModule.parcel_management) },
    action
  );

router.post('/create', orders('write'), validate(createShipmentSchema), createFranchiseOrder);
router.get('/', orders('read'), getFranchiseOrders);
router.get('/track/:waybill', orders('read'), trackFranchiseOrder);
router.get('/:orderId', orders('read'), getFranchiseOrder);
router.put('/:orderId', orders('update'), validate(updateShipmentSchema), updateFranchiseOrder);
router.delete('/:orderId', orders('delete'), deleteFranchiseOrder);

export default router;
