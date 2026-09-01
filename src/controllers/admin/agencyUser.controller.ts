import { Response } from 'express';
import { staffService } from '../../services/admin/staff.service';
import { Staff } from '../../models/admin/staff.model';
import { resolveParcelActor, ParcelActor } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

type AuthRequest = ParcelActorRequest;

/**
 * Users of an agency.
 *
 * Several people can work one agency, each with their own phone number, and log
 * in through the single phone login (/admin/login). They are Staff records of
 * type 'franchise' pinned to the agency, so the existing franchise roles and
 * permissions apply unchanged.
 *
 * Scoped to the caller's own agency: an agency login manages its own users, and
 * so does an agency user who has been given the permission.
 */
const getActor = async (
  req: AuthRequest,
  res: Response
): Promise<ParcelActor | null> => {
  if (req.parcelActor) return req.parcelActor;

  const actor = await resolveParcelActor(req.user?.id);
  if (!actor) {
    res.status(403).json({
      success: false,
      message: 'Account is not allowed to manage agency users (or is inactive)',
    });
    return null;
  }
  return actor;
};

const agencyOf = (
  actor: ParcelActor,
  res: Response
): string | null => {
  if (!actor.agencyId) {
    res.status(403).json({ success: false, message: 'Agency access required' });
    return null;
  }
  return actor.agencyId;
};

/** A user may only be touched if they belong to the caller's agency */
const assertOwnUser = async (
  id: string,
  agencyId: string,
  res: Response
): Promise<boolean> => {
  const staff = await Staff.findById(id).select('franchiseId type');
  if (!staff) {
    res.status(404).json({ success: false, message: 'User not found' });
    return false;
  }
  if (staff.franchiseId?.toString() !== agencyId) {
    res.status(403).json({
      success: false,
      message: 'This user belongs to another agency',
    });
    return false;
  }
  return true;
};

export const getAgencyUsers = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    const result = await staffService.getAllStaff(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
      req.query.search as string,
      req.query.status as string,
      agencyId,
      req.query.roleId as string,
      'franchise'
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getAgencyUserById = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    const id = req.params.id as string;
    if (!(await assertOwnUser(id, agencyId, res))) return;

    const result = await staffService.getStaffById(id);
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const createAgencyUser = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    // The agency and the type are taken from the caller, never from the body
    const result = await staffService.createStaff({
      ...req.body,
      type: 'franchise',
      franchiseId: agencyId,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Agency user created successfully. They can log in with their phone number.',
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateAgencyUser = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    const id = req.params.id as string;
    if (!(await assertOwnUser(id, agencyId, res))) return;

    // A user cannot be moved to another agency or another staff type from here
    const { franchiseId, type, hubId, collectionAgencyId, ...allowed } = req.body;

    const result = await staffService.updateStaff(id, allowed);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateAgencyUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    const id = req.params.id as string;
    if (!(await assertOwnUser(id, agencyId, res))) return;

    const result = await staffService.updateStaffStatus(id, req.body.status);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const deleteAgencyUser = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;
    const agencyId = agencyOf(actor, res);
    if (!agencyId) return;

    const id = req.params.id as string;

    // Don't let a user delete the account they are signed in with
    if (id === actor.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete the user you are logged in as',
      });
    }

    if (!(await assertOwnUser(id, agencyId, res))) return;

    const result = await staffService.deleteStaff(id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
