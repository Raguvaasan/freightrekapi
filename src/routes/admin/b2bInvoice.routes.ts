import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireModulePermission, requireParcelRole } from '../../middleware/parcelActor.middleware';
import { getAdminB2bInvoiceByOrder } from '../../controllers/b2b/invoice.controller';
import { adminModule } from '../../config/adminModule';

const router = Router();
router.use(authMiddleware, requireParcelRole('admin'));
router.get('/', requireModulePermission({ admin: adminModule.invoice_management }, 'read'), getAdminB2bInvoiceByOrder);

export default router;
