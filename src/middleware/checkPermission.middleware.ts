import { Request, Response, NextFunction } from "express";
import { AdminUser } from "../models/admin/adminUser.model";
import { Staff } from "../models/admin/staff.model";
import { Role } from "../models/admin/role.model";
import { FranchiseRole } from "../models/admin/franchiseRole.model";
import { HubRole } from "../models/hub/hubRole.model";

export const checkPermission =
  (module: string, action: "read" | "write" | "update" | "delete") =>
    async (req: any, res: Response, next: NextFunction) => {

      // First check if the user is an AdminUser
      const user = await AdminUser
        .findById(req.user.id)
        .populate("roleId");

      let role: any = null;

      if (user && user.roleId) {
        role = user.roleId;
      } else {
        // Check all staff types with their respective role collections
        const staff = await Staff.findById(req.user.id);
        if (staff && staff.roleId) {
          if (staff.type === 'head_quarter') {
            role = await Role.findById(staff.roleId);
          } else if (staff.type === 'franchise') {
            role = await FranchiseRole.findById(staff.roleId);
          } else if (staff.type === 'hub') {
            role = await HubRole.findById(staff.roleId);
          }
        }
      }

      if (!role) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

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
