"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agencyUser_controller_1 = require("../../controllers/admin/agencyUser.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const agencyModule_1 = require("../../config/agencyModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const staff_validator_1 = require("../../validators/admin/staff.validator");
const yup = __importStar(require("yup"));
/**
 * Users of an agency — base: /admin/agency/users
 *
 * Several users can share one agency, each with their own phone number, and
 * each logs in through the single phone login at /admin/login. `type` and the
 * agency are set from the caller's token, so they are not accepted in the body.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('agency'));
/**
 * A direct agency login manages its own users; agency staff need the matching
 * "Staff Management" permission on their FranchiseRole.
 */
const staff = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.staff_management) }, action);
// Same fields as staff creation, minus everything derived from the token
const createAgencyUserSchema = yup.object({
    body: yup.object({
        name: yup
            .string()
            .required('Name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim(),
        email: yup
            .string()
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim()
            .optional(),
        roleId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
        username: yup.string().min(3).max(50).trim().optional(),
        password: yup.string().min(6).max(100).optional(),
    }),
});
/**
 * @swagger
 * /admin/agency/users:
 *   get:
 *     summary: List this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *       - in: query
 *         name: roleId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Users of this agency }
 *       403: { description: Agency access required }
 *   post:
 *     summary: Add a user to this agency
 *     description: >
 *       Only a name and phone number are needed — the user then logs in with
 *       that number through /admin/login/send-otp. The phone must be unused
 *       across the whole system. Email, username and password are optional.
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: "Priya" }
 *               phone: { type: string, example: "9876500011" }
 *               email: { type: string }
 *               roleId: { type: string, description: FranchiseRole ObjectId }
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       201: { description: User created; can log in by phone }
 *       400: { description: Validation error / phone already registered }
 */
router.get('/', staff('read'), agencyUser_controller_1.getAgencyUsers);
router.post('/', staff('write'), (0, validate_middleware_1.validate)(createAgencyUserSchema), agencyUser_controller_1.createAgencyUser);
/**
 * @swagger
 * /admin/agency/users/{id}:
 *   get:
 *     summary: Get one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User details }
 *       403: { description: User belongs to another agency }
 *   put:
 *     summary: Update one of this agency's users
 *     description: >
 *       `type`, `franchiseId`, `hubId` are ignored — a user cannot be moved to
 *       another agency from here.
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: User belongs to another agency }
 *   delete:
 *     summary: Remove one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Cannot delete the logged-in user }
 */
router.get('/:id', staff('read'), (0, validate_middleware_1.validate)(staff_validator_1.getStaffByIdSchema), agencyUser_controller_1.getAgencyUserById);
router.put('/:id', staff('update'), (0, validate_middleware_1.validate)(staff_validator_1.updateStaffSchema), agencyUser_controller_1.updateAgencyUser);
router.delete('/:id', staff('delete'), (0, validate_middleware_1.validate)(staff_validator_1.deleteStaffSchema), agencyUser_controller_1.deleteAgencyUser);
/**
 * @swagger
 * /admin/agency/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', staff('update'), (0, validate_middleware_1.validate)(staff_validator_1.updateStaffStatusSchema), agencyUser_controller_1.updateAgencyUserStatus);
exports.default = router;
