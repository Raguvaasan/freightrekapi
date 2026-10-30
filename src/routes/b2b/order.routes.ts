import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { B2bUser } from '../../models/b2b/b2bUser.model';
import { confirmB2bOrder, createB2bOrderDraft, getB2bDraftStep2Details, getB2bOrder, listB2bOrders, selectB2bOrderVehicle } from '../../controllers/b2b/order.controller';

const router = Router();
router.use(authMiddleware);
router.use(async (req: Request, res: Response, next: NextFunction) => {
  const user = await B2bUser.findOne({ _id: req.user?.id, status: 'Active' });
  if (!user) return res.status(403).json({ success: false, message: 'Active B2B customer access required' });
  next();
});
router.post('/draft', createB2bOrderDraft);
router.get('/draft/:id/step2', getB2bDraftStep2Details);
router.patch('/draft/:id/vehicle', selectB2bOrderVehicle);
router.post('/draft/:id/confirm', confirmB2bOrder);
router.get('/', listB2bOrders);
router.get('/:id', getB2bOrder);

export default router;
