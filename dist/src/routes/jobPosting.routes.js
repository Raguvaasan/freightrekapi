"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobPosting_controller_1 = require("../controllers/jobPosting.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../middleware/checkPermission.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const jobPosting_validator_1 = require("../validators/jobPosting.validator");
const adminModule_1 = require("../config/adminModule");
const router = (0, express_1.Router)();
// Public routes - Get job postings
router.get('/', jobPosting_controller_1.getAllJobPostings);
router.get('/:id', jobPosting_controller_1.getJobPostingById);
// Admin routes - Create, update, delete job postings
router.post('/', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(jobPosting_validator_1.createJobPostingSchema), jobPosting_controller_1.createJobPosting);
router.put('/:id', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(jobPosting_validator_1.updateJobPostingSchema), jobPosting_controller_1.updateJobPosting);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), jobPosting_controller_1.deleteJobPosting);
exports.default = router;
