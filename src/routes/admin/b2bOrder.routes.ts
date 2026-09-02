import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { listAdminB2bOrders, getAdminB2bOrder } from '../../controllers/b2b/order.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', listAdminB2bOrders);
router.get('/:id', getAdminB2bOrder);

export default router;
