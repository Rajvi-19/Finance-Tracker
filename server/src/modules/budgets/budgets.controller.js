import { z } from 'zod';
import prisma from '../../lib/prisma.js';

const budgetSchema = z.object({
  monthlyLimit: z.number().positive().max(99999999),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100)
});

const categoryBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  limit: z.number().positive().max(99999999),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100)
});

export async function getBudget(req, res, next) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId: req.userId, month, year } }
    });

    // Get total spent this month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const spent = await prisma.expense.aggregate({
      where: { userId: req.userId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true }
    });

    const totalSpent = spent._sum.amount || 0;
    const monthlyLimit = budget?.monthlyLimit || 0;

    res.json({
      budget: budget || null,
      monthlyLimit,
      totalSpent: Math.round(totalSpent * 100) / 100,
      remaining: Math.round((monthlyLimit - totalSpent) * 100) / 100,
      percentage: monthlyLimit > 0 ? Math.round((totalSpent / monthlyLimit) * 100) : 0,
      month, year
    });
  } catch (error) {
    next(error);
  }
}

export async function setBudget(req, res, next) {
  try {
    const result = budgetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', errors: result.error.issues });
    }

    const { monthlyLimit, month, year } = result.data;

    const budget = await prisma.budget.upsert({
      where: { userId_month_year: { userId: req.userId, month, year } },
      update: { monthlyLimit },
      create: { userId: req.userId, monthlyLimit, month, year }
    });

    res.json({ budget });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBudgets(req, res, next) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await prisma.categoryBudget.findMany({
      where: { userId: req.userId, month, year },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });

    // Get spending per category
    const spending = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId: req.userId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true }
    });
    const spendingMap = {};
    spending.forEach(s => { spendingMap[s.categoryId] = s._sum.amount || 0; });

    const result = budgets.map(b => ({
      ...b,
      spent: Math.round((spendingMap[b.categoryId] || 0) * 100) / 100,
      remaining: Math.round((b.limit - (spendingMap[b.categoryId] || 0)) * 100) / 100,
      percentage: Math.round(((spendingMap[b.categoryId] || 0) / b.limit) * 100)
    }));

    res.json({ categoryBudgets: result });
  } catch (error) {
    next(error);
  }
}

export async function setCategoryBudget(req, res, next) {
  try {
    const result = categoryBudgetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', errors: result.error.issues });
    }

    const { categoryId, limit, month, year } = result.data;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId }
    });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const budget = await prisma.categoryBudget.upsert({
      where: { userId_categoryId_month_year: { userId: req.userId, categoryId, month, year } },
      update: { limit },
      create: { userId: req.userId, categoryId, limit, month, year }
    });

    res.json({ categoryBudget: budget });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryBudget(req, res, next) {
  try {
    const existing = await prisma.categoryBudget.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category budget not found' });
    }

    await prisma.categoryBudget.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category budget deleted' });
  } catch (error) {
    next(error);
  }
}
