import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createCategorySchema, updateCategorySchema } from './categories.schemas.js';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from './categories.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', validate(createCategorySchema), createCategory);
router.put('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
