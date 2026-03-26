import { Request, Response } from "express";
import * as hubService from '../../services/admin/hub.service'

export const loginHub = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await hubService.loginHub(username, password);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const createHub = async (req: Request, res: Response) => {
  try {
    const hub = await hubService.createHub(req.body);
    res.status(201).json({ success: true, data: hub });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getHubs = async (req: Request, res: Response) => {
  try {
    const hubs = await hubService.getHubs();
    res.status(200).json({ success: true, data: hubs });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const gethubById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const hub = await hubService.getHubById(id);
    res.status(200).json({ success: true, data: hub });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const updateHub = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const rb = req.body
    const hub = await hubService.updateHub(id, rb)
    if (!hub) {
      return res.status(404).json({ success: false, message: "Hub not found" });
    }

    res.status(200).json({ success: true, data: hub });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const deleteHub = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const hub = await hubService.deleteHub(id);

    if (!hub) {
      return res.status(404).json({ success: false, message: "Hub not found" });
    }

    res.status(200).json({ success: true, message: "Hub deleted" });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
