import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getB2bInvoiceByOrder } from '../../controllers/b2b/invoice.controller';

const router = Router();
router.get('/', authMiddleware, getB2bInvoiceByOrder);

export default router;
