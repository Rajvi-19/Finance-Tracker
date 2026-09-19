import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  icon: z.string().max(10).default('📦'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').default('#6366f1')
});

export const updateCategorySchema = createCategorySchema.partial();
