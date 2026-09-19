import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { getBudget, setBudget, getCategoryBudgets, setCategoryBudget, deleteCategoryBudget } from './budgets.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getBudget);
router.put('/', setBudget);
router.get('/categories', getCategoryBudgets);
router.post('/categories', setCategoryBudget);
router.delete('/categories/:id', deleteCategoryBudget);

export default router;
