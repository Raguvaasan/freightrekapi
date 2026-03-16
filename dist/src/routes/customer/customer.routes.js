"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../../controllers/customer/customer.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const customer_validator_1 = require("../../validators/customer.validator");
const router = (0, express_1.Router)();
// All customer routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error or duplicate entry
 *       401:
 *         description: Unauthorized
 */
router.post('/', (0, validate_middleware_1.validate)(customer_validator_1.createCustomerSchema), customer_controller_1.createCustomer);
/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: List of customers with pagination
 *       401:
 *         description: Unauthorized
 */
router.get('/', customer_controller_1.getAllCustomers);
/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', (0, validate_middleware_1.validate)(customer_validator_1.customerIdParamSchema), customer_controller_1.getCustomerById);
/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', (0, validate_middleware_1.validate)(customer_validator_1.updateCustomerSchema), customer_controller_1.updateCustomer);
/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', (0, validate_middleware_1.validate)(customer_validator_1.customerIdParamSchema), customer_controller_1.deleteCustomer);
exports.default = router;
