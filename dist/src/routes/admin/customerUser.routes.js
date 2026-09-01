"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const customerUser_controller_1 = require("../../controllers/admin/customerUser.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
/**
 * The app / web customer signups — base: /admin/customers
 *
 * Admin-side only, so it is measured against the admin role matrix: an admin
 * staff member needs "Customer Management" on their Role. (The customers who
 * book parcels are a different list — see bookingCustomer.routes.)
 */
const customers = (action) => (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.customer_management, action);
// GET /admin/customers - Get all customer signups
router.get('/', customers('read'), customerUser_controller_1.getAllCustomerUsers);
// PUT /admin/customers/:id - Update a customer
router.put('/:id', customers('update'), customerUser_controller_1.updateCustomerUser);
// DELETE /admin/customers/:id - Delete a customer
router.delete('/:id', customers('delete'), customerUser_controller_1.deleteCustomerUser);
exports.default = router;
