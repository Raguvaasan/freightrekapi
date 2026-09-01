import { Request, Response } from 'express';
import * as hubManageStaffService from '../../services/hub/hubManageStaff.service';
import { resolveHubId } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

/**
 * The hub whose staff these are. A direct hub login is the hub; a hub staff
 * member has an id of their own, so the hub is read off their record.
 */
const hubOf = (req: ParcelActorRequest): Promise<string | null> =>
  req.parcelActor?.hubId
    ? Promise.resolve(req.parcelActor.hubId)
    : resolveHubId(req.user?.id);

export const getHubStaff = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await hubManageStaffService.getHubStaff(hubId, page, limit, search);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getHubStaffById = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.getHubStaffById(hubId, req.params.id as string);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createHubStaff = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.createHubStaff(hubId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHubStaff = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.updateHubStaff(hubId, req.params.id as string, req.body);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteHubStaff = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.deleteHubStaff(hubId, req.params.id as string);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHubStaffStatus = async (req: ParcelActorRequest, res: Response) => {
  try {
    const hubId = await hubOf(req);
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Active or Inactive' });
    }

    const result = await hubManageStaffService.updateHubStaffStatus(hubId, req.params.id as string, status);
    if (!result.success) {
      const status404 = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status404).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
