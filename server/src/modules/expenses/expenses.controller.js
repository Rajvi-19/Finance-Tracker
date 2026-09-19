import prisma from '../../lib/prisma.js';

export async function getExpenses(req, res, next) {
  try {
    const userId = req.userId;
    const {
      page = '1', limit = '20', category, startDate, endDate,
      minAmount, maxAmount, merchant, paymentMethod, search, sort = 'newest'
    } = req.validatedQuery || req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause — always scoped to userId
    const where = { userId };

    if (category) where.categoryId = category;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }
    if (merchant) {
      where.merchant = { contains: merchant };
    }
    if (search) {
      where.OR = [
        { merchant: { contains: search } },
        { note: { contains: search } }
      ];
    }

    // Build orderBy
    const orderBy = {
      newest: { date: 'desc' },
      oldest: { date: 'asc' },
      highest: { amount: 'desc' },
      lowest: { amount: 'asc' }
    }[sort] || { date: 'desc' };

    const [expenses, total, totals] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    res.json({
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      // This represents every matching expense, not only the current page.
      totalSpent: Math.round((totals._sum.amount || 0) * 100) / 100
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req, res, next) {
  try {
    const { amount, categoryId, merchant, date, note, paymentMethod } = req.validatedBody;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId }
    });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const expense = await prisma.expense.create({
      data: {
        userId: req.userId,
        categoryId,
        amount,
        merchant: merchant || '',
        date: new Date(date),
        note: note || '',
        paymentMethod: paymentMethod || 'Cash'
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req, res, next) {
  try {
    // First verify the expense belongs to this user
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { amount, categoryId, merchant, date, note, paymentMethod } = req.validatedBody;

    // If changing category, verify it belongs to user
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: req.userId }
      });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (categoryId) updateData.categoryId = categoryId;
    if (merchant !== undefined) updateData.merchant = merchant;
    if (date) updateData.date = new Date(date);
    if (note !== undefined) updateData.note = note;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: updateData,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    });

    res.json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({ where: { id: req.params.id } });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
}
