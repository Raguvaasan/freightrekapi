"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const hubManageStaff_controller_1 = require("../../controllers/hub/hubManageStaff.controller");
const hubManageStaff_validator_1 = require("../../validators/hub/hubManageStaff.validator");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
/**
 * A direct hub login manages its own staff; hub staff need the matching
 * "Staff Management" permission on their HubRole.
 */
const staff = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.staff_management) }, action);
// GET /hub/manage/staff           - List hub's own staff
router.get('/', staff('read'), hubManageStaff_controller_1.getHubStaff);
// GET /hub/manage/staff/:id       - Get hub staff by ID
router.get('/:id', staff('read'), hubManageStaff_controller_1.getHubStaffById);
// POST /hub/manage/staff          - Create hub staff
router.post('/', staff('write'), (0, validate_middleware_1.validate)(hubManageStaff_validator_1.createHubStaffSchema), hubManageStaff_controller_1.createHubStaff);
// PUT /hub/manage/staff/:id       - Edit hub staff
router.put('/:id', staff('update'), (0, validate_middleware_1.validate)(hubManageStaff_validator_1.updateHubStaffSchema), hubManageStaff_controller_1.updateHubStaff);
// DELETE /hub/manage/staff/:id    - Delete hub staff
router.delete('/:id', staff('delete'), hubManageStaff_controller_1.deleteHubStaff);
// PATCH /hub/manage/staff/:id/status  - Update staff status
router.patch('/:id/status', staff('update'), hubManageStaff_controller_1.updateHubStaffStatus);
exports.default = router;
