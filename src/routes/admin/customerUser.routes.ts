import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';
import { getAllCustomerUsers, updateCustomerUser, deleteCustomerUser } from '../../controllers/admin/customerUser.controller';

const router = Router();

router.use(authMiddleware);

/**
 * The app / web customer signups — base: /admin/customers
 *
 * Admin-side only, so it is measured against the admin role matrix: an admin
 * staff member needs "Customer Management" on their Role. (The customers who
 * book parcels are a different list — see bookingCustomer.routes.)
 */
const customers = (action: 'read' | 'write' | 'update' | 'delete') =>
  checkPermission(adminModule.customer_management, action);

// GET /admin/customers - Get all customer signups
router.get('/', customers('read'), getAllCustomerUsers);

// PUT /admin/customers/:id - Update a customer
router.put('/:id', customers('update'), updateCustomerUser);

// DELETE /admin/customers/:id - Delete a customer
router.delete('/:id', customers('delete'), deleteCustomerUser);

export default router;
