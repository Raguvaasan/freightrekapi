"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailAuth_controller_1 = require("../../controllers/customer/emailAuth.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const customerEmailAuth_validator_1 = require("../../validators/customerEmailAuth.validator");
const router = (0, express_1.Router)();
// POST /api/customer/email-auth/signup
router.post('/signup', (0, validate_middleware_1.validate)(customerEmailAuth_validator_1.customerEmailSignupSchema), emailAuth_controller_1.signup);
// POST /api/customer/email-auth/login
router.post('/login', (0, validate_middleware_1.validate)(customerEmailAuth_validator_1.customerEmailLoginSchema), emailAuth_controller_1.login);
exports.default = router;
