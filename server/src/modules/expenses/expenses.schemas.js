import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(99999999, 'Amount too large'),
  categoryId: z.string().uuid('Invalid category'),
  merchant: z.string().max(200).default(''),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  note: z.string().max(500).default(''),
  paymentMethod: z.enum(['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other']).default('Cash')
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  merchant: z.string().optional(),
  paymentMethod: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional().default('newest')
});
