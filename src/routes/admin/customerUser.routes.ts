import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getAllCustomerUsers, updateCustomerUser, deleteCustomerUser } from '../../controllers/admin/customerUser.controller';

const router = Router();

// GET /admin/customers - Get all customer signups
router.get('/', authMiddleware, getAllCustomerUsers);

// PUT /admin/customers/:id - Update a customer
router.put('/:id', authMiddleware, updateCustomerUser);

// DELETE /admin/customers/:id - Delete a customer
router.delete('/:id', authMiddleware, deleteCustomerUser);

export default router;
