import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { B2bUser } from '../../models/b2b/b2bUser.model';
import { b2bInvoiceService } from '../../services/b2b/invoice.service';

export const getB2bInvoiceByOrder = async (req: AuthRequest, res: Response) => {
  const user = await B2bUser.findOne({ _id: req.user?.id, status: 'Active' });
  if (!user) return res.status(403).json({ success: false, message: 'Active B2B customer access required' });

  try {
    const result = await b2bInvoiceService.getByOrder(String(req.query.orderId), user._id.toString());
    return res.status(result.success ? 200 : result.code || 400).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching B2B invoice' });
  }
};

export const getAdminB2bInvoiceByOrder = async (req: Request, res: Response) => {
  try {
    const result = await b2bInvoiceService.getByOrder(String(req.query.orderId));
    return res.status(result.success ? 200 : result.code || 400).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching B2B invoice' });
  }
};
