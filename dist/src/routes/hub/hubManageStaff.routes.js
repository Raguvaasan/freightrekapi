"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const hubManageStaff_controller_1 = require("../../controllers/hub/hubManageStaff.controller");
const hubManageStaff_validator_1 = require("../../validators/hub/hubManageStaff.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// GET /hub/manage/staff           - List hub's own staff
router.get('/', hubManageStaff_controller_1.getHubStaff);
// GET /hub/manage/staff/:id       - Get hub staff by ID
router.get('/:id', hubManageStaff_controller_1.getHubStaffById);
// POST /hub/manage/staff          - Create hub staff
router.post('/', (0, validate_middleware_1.validate)(hubManageStaff_validator_1.createHubStaffSchema), hubManageStaff_controller_1.createHubStaff);
// PUT /hub/manage/staff/:id       - Edit hub staff
router.put('/:id', (0, validate_middleware_1.validate)(hubManageStaff_validator_1.updateHubStaffSchema), hubManageStaff_controller_1.updateHubStaff);
// DELETE /hub/manage/staff/:id    - Delete hub staff
router.delete('/:id', hubManageStaff_controller_1.deleteHubStaff);
// PATCH /hub/manage/staff/:id/status  - Update staff status
router.patch('/:id/status', hubManageStaff_controller_1.updateHubStaffStatus);
exports.default = router;
