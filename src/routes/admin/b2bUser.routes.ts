import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getB2bUser, listB2bUsers, updateB2bUser } from '../../controllers/b2b/register.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', listB2bUsers);
router.get('/:id', getB2bUser);
router.put('/:id', updateB2bUser);

export default router;
