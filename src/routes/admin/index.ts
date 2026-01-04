import { Router } from "express";
import authRoutes from "./auth.routes";
import roleRoutes from "./role.routes";
import hubRoutes from "./hub.routes";
import agencyRoutes from "./agency.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/role", roleRoutes);
router.use("/hub", hubRoutes);
router.use("/agency", agencyRoutes);

export default router;
