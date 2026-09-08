import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { assignAdminB2bOrderDriver, assignAdminB2bOrderVehicle, getB2bDrivers, getB2bVehicles, listAdminB2bOrders, getAdminB2bOrder, updateAdminB2bOrderStatus } from '../../controllers/b2b/order.controller';
import { requireParcelRole, requireModulePermission } from '../../middleware/parcelActor.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();
router.use(authMiddleware, requireParcelRole('admin'));
router.get('/drivers', requireModulePermission({ admin: adminModule.driver_management }, 'read'), getB2bDrivers);
router.get('/vehicles', requireModulePermission({ admin: adminModule.vehicle_management }, 'read'), getB2bVehicles);
router.patch('/:id/assign-driver', requireModulePermission({ admin: adminModule.parcel_management }, 'update'), assignAdminB2bOrderDriver);
router.patch('/:id/assign-vehicle', requireModulePermission({ admin: adminModule.parcel_management }, 'update'), assignAdminB2bOrderVehicle);
router.patch('/:id/status', requireModulePermission({ admin: adminModule.parcel_management }, 'update'), updateAdminB2bOrderStatus);
router.get('/', requireModulePermission({ admin: adminModule.parcel_management }, 'read'), listAdminB2bOrders);
router.get('/:id', requireModulePermission({ admin: adminModule.parcel_management }, 'read'), getAdminB2bOrder);

export default router;
