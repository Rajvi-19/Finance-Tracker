import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { getProfile, updateProfile, changePassword, deleteAccount } from './profile.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;
