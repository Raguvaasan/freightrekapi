import { Router } from 'express';
import { registerB2b, getB2bProfile, updateB2bProfile } from '../../controllers/b2b/register.controller';
import { sendB2bOtp, verifyB2bOtp } from '../../controllers/b2b/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', registerB2b);
router.post('/send-otp', sendB2bOtp);
router.post('/verify-otp', verifyB2bOtp);
router.get('/profile', authMiddleware, getB2bProfile);
router.put('/profile', authMiddleware, updateB2bProfile);

export default router;
