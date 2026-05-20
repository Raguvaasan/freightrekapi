import { Router } from "express";
import authRoutes from "./auth.routes";
import roleRoutes from "./role.routes";
import hubRoutes from "./hub.routes";
import agencyRoutes from "./agency.routes";
import staffRoutes from "./staff.routes";
import franchiseStaffRoutes from "./franchise-staff.routes";
import customerUserRoutes from "./customerUser.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/role", roleRoutes);
router.use("/hub", hubRoutes);
router.use("/agency", agencyRoutes);
router.use("/staff", staffRoutes);
router.use("/franchise/staff", franchiseStaffRoutes);
router.use("/customers", customerUserRoutes);

export default router;
