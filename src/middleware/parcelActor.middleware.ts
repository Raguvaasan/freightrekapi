import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { resolveParcelActor, ParcelActor } from '../utils/parcelActor';
import { ParcelActorRole } from '../models/admin/parcelOrder.model';
import {
  checkPermission,
  resolveUserRole,
  roleAllows,
  PermissionAction,
} from './checkPermission.middleware';

export interface ParcelActorRequest extends AuthRequest {
  parcelActor?: ParcelActor;
}

/**
 * Resolve the acting party (admin / agency / hub) from the JWT and reject
 * anyone whose role is not allowed on this route group. Attaches the resolved
 * actor to `req.parcelActor` so the controller does not look it up again.
 */
export const requireParcelRole =
  (...roles: ParcelActorRole[]) =>
  async (req: ParcelActorRequest, res: Response, next: NextFunction) => {
    const actor = await resolveParcelActor(req.user?.id);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message: 'Account is not allowed to access the parcel flow (or is inactive)',
      });
    }

    if (!roles.includes(actor.role)) {
      return res.status(403).json({
        success: false,
        message: `${roles.join(' / ')} access required`,
      });
    }

    req.parcelActor = actor;
    next();
  };

/**
 * Is this caller the account that *owns* the module rather than a staff member
 * working inside it?
 *
 * A direct Agency or Hub login carries no role record — the token is the agency
 * / hub record itself — so it is the owner and every module of its own area is
 * open to it. A staff member logging into the same area is a different id from
 * the agency / hub they belong to, and is measured against the FranchiseRole /
 * HubRole attached to them.
 */
const isModuleOwner = (actor: ParcelActor): boolean =>
  (actor.role === 'agency' && actor.id === actor.agencyId) ||
  (actor.role === 'hub' && actor.id === actor.hubId);

/**
 * Run the role/permission check only for an admin caller.
 *
 * Kept for routes shared by admin and a direct agency login, where the
 * isolation for the agency comes from the actor scope the controller applies.
 * Prefer `requireModulePermission` on anything a staff member can reach.
 *
 * Must be mounted after requireParcelRole, which resolves `req.parcelActor`.
 */
export const requireAdminPermission =
  (module: string, action: PermissionAction) => {
    const guard = checkPermission(module, action);

    return (req: ParcelActorRequest, res: Response, next: NextFunction) =>
      req.parcelActor?.role === 'admin' ? guard(req, res, next) : next();
  };

/**
 * The module name to measure each kind of caller against on one route.
 *
 * A list means "any of these grants it" — used where a module has been split
 * out of a wider one, so a role written before the split still passes.
 */
export interface ModulesByRole {
  admin?: string | string[];
  agency?: string | string[];
  hub?: string | string[];
}

/**
 * Permission gate for a route reachable by more than one kind of login.
 *
 * The three areas keep their permissions in separate collections and name their
 * modules differently ("Parcel Management" on the admin side, the agency's own
 * list on the franchise side, and so on), so the caller states the module per
 * role and the acting party decides which one applies:
 *
 *   admin  -> AdminUser role, or the Role on a head-office staff member
 *   agency -> direct agency login passes; agency staff -> FranchiseRole
 *   hub    -> direct hub login passes; hub staff -> HubRole
 *
 * A role with no entry for the module is denied, which is what makes a staff
 * login narrower than the agency / hub login it belongs to. Omitting a role
 * from `modules` leaves that role ungated on this route.
 *
 * Must be mounted after requireParcelRole, which resolves `req.parcelActor`.
 */
export const requireModulePermission =
  (modules: ModulesByRole, action: PermissionAction) =>
  async (req: ParcelActorRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.parcelActor || (await resolveParcelActor(req.user?.id));

      if (!actor) {
        return res.status(403).json({
          success: false,
          message: 'Account is not allowed here (or is inactive)',
        });
      }

      const configured = modules[actor.role];
      // Not gated for this kind of caller
      if (!configured) return next();

      // The agency / hub itself owns every module of its own area
      if (isModuleOwner(actor)) return next();

      const names = Array.isArray(configured) ? configured : [configured];

      const resolved = await resolveUserRole(actor.id);
      // The role must govern the same side the caller is acting on: module
      // names collide across the three collections, so a franchise role must
      // never satisfy a hub route (or an admin one) that happens to share a name
      if (!resolved || resolved.scope !== actor.role) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!names.some((name) => roleAllows(resolved.role, name, action))) {
        return res.status(403).json({
          success: false,
          message: `Permission denied for "${names[0]}"`,
        });
      }

      return next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error checking permissions',
      });
    }
  };
