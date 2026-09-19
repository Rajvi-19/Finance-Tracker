import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { getSettings, updateSettings } from './settings.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
