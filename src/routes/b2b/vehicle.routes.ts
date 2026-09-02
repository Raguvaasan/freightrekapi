import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createB2bVehicle, deactivateB2bVehicle, deleteB2bVehicle, getB2bVehicle, listB2bVehicles, updateB2bVehicle } from '../../controllers/b2b/vehicle.controller';

const router = Router();
router.use(authMiddleware);
router.post('/', createB2bVehicle);
router.get('/', listB2bVehicles);
router.get('/:id', getB2bVehicle);
router.put('/:id', updateB2bVehicle);
router.patch('/:id/deactivate', deactivateB2bVehicle);
router.delete('/:id', deleteB2bVehicle);

export default router;
