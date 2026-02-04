"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const wallet_controller_1 = require("../controllers/wallet.controller");
const wallet_validator_1 = require("../validators/wallet.validator");
const router = (0, express_1.Router)();
// Protected routes (require authentication)
router.get('/balance', auth_middleware_1.authMiddleware, wallet_controller_1.getBalance);
router.post('/create-payment-order', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(wallet_validator_1.createPaymentOrderSchema), wallet_controller_1.createPaymentOrder);
router.post('/verify-payment', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(wallet_validator_1.verifyPaymentSchema), wallet_controller_1.verifyPayment);
router.get('/transactions', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(wallet_validator_1.getTransactionsSchema), wallet_controller_1.getTransactions);
exports.default = router;
