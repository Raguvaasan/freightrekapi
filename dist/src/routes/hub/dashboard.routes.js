"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const dashboard_controller_1 = require("../../controllers/hub/dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// GET /hub/dashboard
router.get('/', dashboard_controller_1.getHubDashboard);
exports.default = router;
