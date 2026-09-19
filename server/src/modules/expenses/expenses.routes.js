import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateQuery } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema } from './expenses.schemas.js';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from './expenses.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(expenseQuerySchema), getExpenses);
router.post('/', validate(createExpenseSchema), createExpense);
router.get('/:id', getExpense);
router.put('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
