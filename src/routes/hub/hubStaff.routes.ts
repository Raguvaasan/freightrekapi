import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  getProfile,
  getMyTasks,
  getDeliveryHistory,
  getBookingDetail,
  updateOrderStatus,
  updateAccountSettings,
  editOrder,
} from '../../controllers/hub/hubStaff.controller';

const router = Router();

// All routes require hub staff JWT
router.use(authMiddleware);

/**
 * @swagger
 * /hub/staff/profile:
 *   get:
 *     summary: Get hub staff profile with delivery stats
 *     tags: [Hub Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile with totalDeliveries and totalOrders
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /hub/staff/my-tasks:
 *   get:
 *     summary: Get active/in-progress orders assigned to this hub
 *     tags: [Hub Staff]
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
 *     responses:
 *       200:
 *         description: List of active tasks
 */
router.get('/my-tasks', getMyTasks);

/**
 * @swagger
 * /hub/staff/delivery-history:
 *   get:
 *     summary: Get completed/cancelled/failed delivery history
 *     tags: [Hub Staff]
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
 *     responses:
 *       200:
 *         description: Delivery history list
 */
router.get('/delivery-history', getDeliveryHistory);

/**
 * @swagger
 * /hub/staff/booking/{orderId}:
 *   get:
 *     summary: Get full booking detail with address, package, charges
 *     tags: [Hub Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full booking detail with charges breakdown
 */
router.get('/booking/:orderId', getBookingDetail);

/**
 * @swagger
 * /hub/staff/booking/{orderId}/status:
 *   patch:
 *     summary: Update order status (confirm pickup/delivery)
 *     tags: [Hub Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, in_transit, delivered, failed]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/booking/:orderId/status', updateOrderStatus);

/**
 * @swagger
 * /hub/staff/booking/{orderId}/edit:
 *   put:
 *     summary: Edit order details (weight, dimensions, amount, address)
 *     tags: [Hub Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weight:
 *                 type: string
 *               shipmentWidth:
 *                 type: string
 *               shipmentHeight:
 *                 type: string
 *               quantity:
 *                 type: string
 *               totalAmount:
 *                 type: string
 *               codAmount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated with recalculated charges and extra amount
 */
router.put('/booking/:orderId/edit', editOrder);

/**
 * @swagger
 * /hub/staff/account-settings:
 *   put:
 *     summary: Update hub staff account settings (name, phone, password)
 *     tags: [Hub Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Account settings updated
 */
router.put('/account-settings', updateAccountSettings);

export default router;
