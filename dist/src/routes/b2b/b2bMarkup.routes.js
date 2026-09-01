"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const b2bMarkup_controller_1 = require("../../controllers/b2b/b2bMarkup.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const b2bMarkup_validator_1 = require("../../validators/b2b/b2bMarkup.validator");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// B2B Rate Calculator Markup Routes
router.get('/rate-calculator-markup', auth_middleware_1.authMiddleware, b2bMarkup_controller_1.getB2bRateCalculatorMarkup);
router.post('/rate-calculator-markup', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(b2bMarkup_validator_1.createB2bMarkupSchema), b2bMarkup_controller_1.createOrUpdateB2bRateCalculatorMarkup);
// B2B Rate Card Markup Routes
router.get('/rate-card-markup', auth_middleware_1.authMiddleware, b2bMarkup_controller_1.getB2bRateCardMarkup);
router.post('/rate-card-markup', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), (0, validate_middleware_1.validate)(b2bMarkup_validator_1.createB2bMarkupSchema), b2bMarkup_controller_1.createOrUpdateB2bRateCardMarkup);
// Delete B2B Markup
router.delete('/:id', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.settings, 'write'), b2bMarkup_controller_1.deleteB2bMarkup);
exports.default = router;
