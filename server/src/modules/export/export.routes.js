import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { exportData } from './export.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/:format', exportData);

export default router;
