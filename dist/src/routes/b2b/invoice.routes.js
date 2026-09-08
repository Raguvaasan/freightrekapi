"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const invoice_controller_1 = require("../../controllers/b2b/invoice.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, invoice_controller_1.getB2bInvoiceByOrder);
exports.default = router;
