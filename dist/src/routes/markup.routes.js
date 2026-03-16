"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const markup_controller_1 = require("../controllers/markup.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../middleware/checkPermission.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const markup_validator_1 = require("../validators/markup.validator");
const adminModule_1 = require("../config/adminModule");
const router = (0, express_1.Router)();
// Public Route for Frontend (No Token Required)
router.get('/public/rate-card-markup', markup_controller_1.getRateCardMarkup);
// Rate Calculator Markup Routes
router.get('/rate-calculator-markup', auth_middleware_1.authMiddleware, markup_controller_1.getRateCalculatorMarkup);
router.post('/rate-calculator-markup', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(markup_validator_1.createMarkupSchema), markup_controller_1.createOrUpdateRateCalculatorMarkup);
// Rate Card Markup Routes
router.get('/rate-card-markup', auth_middleware_1.authMiddleware, markup_controller_1.getRateCardMarkup);
router.post('/rate-card-markup', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(markup_validator_1.createMarkupSchema), markup_controller_1.createOrUpdateRateCardMarkup);
exports.default = router;
