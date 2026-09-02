import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { confirmB2bOrder, createB2bOrderDraft, getB2bDraftStep2Details, getB2bOrder, listAdminB2bOrders, listB2bOrders } from '../../controllers/b2b/order.controller';

const router = Router();
router.use(authMiddleware);
router.post('/draft', createB2bOrderDraft);
router.get('/draft/:id/step2', getB2bDraftStep2Details);
router.post('/draft/:id/confirm', confirmB2bOrder);
router.get('/', listB2bOrders);
router.get('/:id', getB2bOrder);

export default router;
