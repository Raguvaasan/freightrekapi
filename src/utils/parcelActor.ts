import { AdminUser } from '../models/admin/adminUser.model';
import { Agency } from '../models/admin/agency.model';
import { HubModel } from '../models/hub/hub.model';
import { Staff } from '../models/admin/staff.model';
import { ParcelActorRole } from '../models/admin/parcelOrder.model';

export interface ParcelActor {
  role: ParcelActorRole;
  id: string;
  name?: string;
  // Set when role === 'agency' -> the Agency the caller acts for
  agencyId?: string;
  // Set when role === 'hub' -> the hub the caller acts for
  hubId?: string;
}

/**
 * Resolve who the authenticated caller is for the parcel flow.
 *
 * Every login in this app issues a token carrying only the record `_id`
 * (see utils/jwt generateToken), so the acting party is identified by
 * looking the id up across the login-capable collections:
 *   AdminUser            -> admin
 *   Agency               -> agency (direct agency login)
 *   Hub                  -> hub    (hub direct login)
 *   Staff head_quarter   -> admin
 *   Staff franchise      -> agency (franchiseId)
 *   Staff hub            -> hub    (hubId)
 */
export const resolveParcelActor = async (
  userId?: string
): Promise<ParcelActor | null> => {
  if (!userId) return null;

  const admin = await AdminUser.findById(userId).select('name status');
  if (admin) {
    if (admin.status === false) return null;
    return { role: 'admin', id: userId, name: admin.name };
  }

  const agency = await Agency.findById(userId).select('agencyName status');
  if (agency) {
    if (agency.status !== 'Active') return null;
    return {
      role: 'agency',
      id: userId,
      name: agency.agencyName,
      agencyId: agency._id.toString(),
    };
  }

  const hub = await HubModel.findById(userId).select('hubName status');
  if (hub) {
    if (!hub.status) return null;
    return {
      role: 'hub',
      id: userId,
      name: hub.hubName,
      hubId: hub._id.toString(),
    };
  }

  const staff = await Staff.findById(userId).select(
    'name type status franchiseId hubId'
  );
  if (staff) {
    if (staff.status !== 'Active') return null;

    if (staff.type === 'head_quarter') {
      return { role: 'admin', id: userId, name: staff.name };
    }
    if (staff.type === 'franchise' && staff.franchiseId) {
      return {
        role: 'agency',
        id: userId,
        name: staff.name,
        agencyId: staff.franchiseId.toString(),
      };
    }
    if (staff.type === 'hub' && staff.hubId) {
      return {
        role: 'hub',
        id: userId,
        name: staff.name,
        hubId: staff.hubId.toString(),
      };
    }
  }

  return null;
};

/**
 * The agency a caller acts for — the agency itself on a direct login, or the
 * agency an agency staff member belongs to.
 *
 * Controllers scoped to "my agency" need this rather than the token id: a staff
 * member's id is their own, not their agency's, so reading the token directly
 * scopes their screens to an agency that does not exist.
 */
export const resolveAgencyId = async (userId?: string): Promise<string | null> => {
  const actor = await resolveParcelActor(userId);
  return actor?.role === 'agency' ? actor.agencyId ?? null : null;
};

/** The hub a caller acts for — the hub itself, or the hub its staff belongs to */
export const resolveHubId = async (userId?: string): Promise<string | null> => {
  const actor = await resolveParcelActor(userId);
  return actor?.role === 'hub' ? actor.hubId ?? null : null;
};
