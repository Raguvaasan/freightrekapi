import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getB2bCustomerDetails, listB2bUsers, updateB2bUser } from '../../controllers/b2b/register.controller';
import { requireParcelRole, requireModulePermission } from '../../middleware/parcelActor.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();
router.use(authMiddleware, requireParcelRole('admin'));
router.get('/', requireModulePermission({ admin: adminModule.customer_management }, 'read'), listB2bUsers);
router.get('/:id', requireModulePermission({ admin: adminModule.customer_management }, 'read'), getB2bCustomerDetails);
router.put('/:id', requireModulePermission({ admin: adminModule.customer_management }, 'update'), updateB2bUser);

export default router;
