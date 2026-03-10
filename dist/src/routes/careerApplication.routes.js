"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const careerApplicationController = __importStar(require("../controllers/careerApplication.controller"));
const validate_middleware_1 = require("../middleware/validate.middleware");
const careerApplication_validator_1 = require("../validators/careerApplication.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
// List all applications - with optional filters
router.get('/', careerApplicationController.getAllApplications);
// Get application by ID
router.get('/:id', careerApplicationController.getApplicationById);
// Create new application (public - anyone can apply)
router.post('/', (0, validate_middleware_1.validate)(careerApplication_validator_1.createCareerApplicationSchema), careerApplicationController.createApplication);
// Get applications by job posting (public)
router.get('/job-posting/:jobPostingId', careerApplicationController.getApplicationsByJobPosting);
// Admin-only routes
// Update application (admin only - can update status and details)
router.put('/:id', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(careerApplication_validator_1.updateCareerApplicationSchema), careerApplicationController.updateApplication);
// Delete application (admin only)
router.delete('/:id', auth_middleware_1.authMiddleware, careerApplicationController.deleteApplication);
exports.default = router;
