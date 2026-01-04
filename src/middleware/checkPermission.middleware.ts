import { Request, Response, NextFunction } from "express";
import { AdminUser } from "../models/admin/adminUser.model";

export const checkPermission =
  (module: string, action: "read" | "write" | "update" | "delete") =>
    async (req: any, res: Response, next: NextFunction) => {

      const user = await AdminUser
        .findById(req.user.id)
        .populate("roleId");
      if (!user || !user.roleId) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const role: any = user.roleId;

      if (role.isRoot) {
        return next();
      }

      const modulePermission = role.permissions.find(
        (p: any) => p.module === module
      );

      if (!modulePermission || !modulePermission[action]) {
        return res.status(403).json({ success: false, message: "Permission denied" });
      }

      next();
    };
