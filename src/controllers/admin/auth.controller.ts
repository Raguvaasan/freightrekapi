import { Request, Response } from "express";
import * as authService from "../../services/admin/auth.service"

export const register = async (req: Request, res: Response) => {
  try {
    const rb = req.body
    const result = await authService.register(rb)
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message })
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {

    const rb = req.body
    const result = await authService.login(rb)
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message })
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.token
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
