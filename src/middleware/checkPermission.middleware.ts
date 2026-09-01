import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AdminUser } from "../models/admin/adminUser.model";
import { Staff } from "../models/admin/staff.model";
import { Role } from "../models/admin/role.model";
import { FranchiseRole } from "../models/admin/franchiseRole.model";
import { HubRole } from "../models/hub/hubRole.model";

export type PermissionAction = "read" | "write" | "update" | "delete";

/**
 * Which side of the product a role record governs.
 *
 * The three collections name their modules independently and several names
 * collide ("Customer Management", "Dashboard", ...), so a role is only ever
 * measured against routes of its own side — otherwise a franchise role granting
 * "Customer Management" would open the admin customer screen.
 */
export type PermissionScope = "admin" | "agency" | "hub";

export interface ResolvedRole {
  role: any;
  scope: PermissionScope;
}

/**
 * The role record backing a login, with the side it governs, or null when the
 * account carries none.
 *
 * A direct Agency / Hub login has no role record at all — it *is* the owner of
 * its area — which is why callers distinguish "no role record" from "role
 * record without the permission" instead of denying both.
 */
export const resolveUserRole = async (
  userId?: string
): Promise<ResolvedRole | null> => {
  if (!userId || !Types.ObjectId.isValid(userId)) return null;

  const user = await AdminUser.findById(userId).populate("roleId");
  if (user && user.roleId) return { role: user.roleId, scope: "admin" };

  // Every staff type keeps its permissions in its own role collection
  const staff = await Staff.findById(userId);
  if (staff && staff.roleId) {
    if (staff.type === 'head_quarter') {
      const role = await Role.findById(staff.roleId);
      return role ? { role, scope: "admin" } : null;
    }
    if (staff.type === 'franchise') {
      const role = await FranchiseRole.findById(staff.roleId);
      return role ? { role, scope: "agency" } : null;
    }
    if (staff.type === 'hub') {
      const role = await HubRole.findById(staff.roleId);
      return role ? { role, scope: "hub" } : null;
    }
  }

  return null;
};

/** Does this role record grant `action` on `module`? A root role grants everything. */
export const roleAllows = (
  role: any,
  module: string,
  action: PermissionAction
): boolean => {
  if (!role) return false;
  if (role.isRoot) return true;

  const modulePermission = (role.permissions || []).find(
    (p: any) => p.module === module
  );

  return !!(modulePermission && modulePermission[action]);
};

/**
 * Permission gate for an admin-side route.
 *
 * Only an admin role passes: an AdminUser's role, or the Role on a head-office
 * staff member. A franchise / hub staff member is refused here whatever their
 * own role says — those sides are gated by requireModulePermission instead.
 */
export const checkPermission =
  (module: string, action: PermissionAction) =>
    async (req: any, res: Response, next: NextFunction) => {
      try {
        // authMiddleware must run first; without it there is nobody to check
        if (!req.user?.id) {
          return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const resolved = await resolveUserRole(req.user.id);

        if (!resolved || resolved.scope !== "admin") {
          return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (!roleAllows(resolved.role, module, action)) {
          return res.status(403).json({ success: false, message: "Permission denied" });
        }

        return next();
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: error.message || "Error checking permissions",
        });
      }
    };
