"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const hub_routes_1 = __importDefault(require("./hub.routes"));
const agency_routes_1 = __importDefault(require("./agency.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/role", role_routes_1.default);
router.use("/hub", hub_routes_1.default);
router.use("/agency", agency_routes_1.default);
exports.default = router;
