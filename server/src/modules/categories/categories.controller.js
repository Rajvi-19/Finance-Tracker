import prisma from '../../lib/prisma.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { expenses: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate spending per category
    const categorySpending = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId: req.userId },
      _sum: { amount: true }
    });

    const spendingMap = {};
    categorySpending.forEach(item => {
      spendingMap[item.categoryId] = item._sum.amount || 0;
    });

    const totalSpent = categorySpending.reduce((sum, item) => sum + (item._sum.amount || 0), 0);

    const result = categories.map(cat => ({
      ...cat,
      totalSpent: spendingMap[cat.id] || 0,
      transactionCount: cat._count.expenses,
      percentage: totalSpent > 0 ? Math.round(((spendingMap[cat.id] || 0) / totalSpent) * 100) : 0
    }));

    res.json({ categories: result, totalSpent });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(req, res, next) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get spending stats for this category
    const stats = await prisma.expense.aggregate({
      where: { categoryId: category.id, userId: req.userId },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true }
    });

    res.json({
      category: {
        ...category,
        totalSpent: stats._sum.amount || 0,
        transactionCount: stats._count,
        averageTransaction: Math.round((stats._avg.amount || 0) * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, icon, color } = req.validatedBody;

    // Check for duplicate name for this user
    const existing = await prisma.category.findFirst({
      where: { userId: req.userId, name }
    });
    if (existing) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        userId: req.userId,
        name,
        icon: icon || '📦',
        color: color || '#6366f1',
        isDefault: false
      }
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name, icon, color } = req.validatedBody;

    // Check for duplicate name
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: { userId: req.userId, name, NOT: { id: req.params.id } }
      });
      if (duplicate) {
        return res.status(409).json({ error: 'A category with this name already exists' });
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(color && { color })
      }
    });

    res.json({ category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find or create "Other" category
    let otherCategory = await prisma.category.findFirst({
      where: { userId: req.userId, name: 'Other' }
    });

    if (!otherCategory) {
      otherCategory = await prisma.category.create({
        data: { userId: req.userId, name: 'Other', icon: '📦', color: '#6b7280', isDefault: true }
      });
    }

    // Don't allow deleting the "Other" category
    if (existing.name === 'Other') {
      return res.status(400).json({ error: 'Cannot delete the "Other" category' });
    }

    // Move expenses to "Other"
    await prisma.expense.updateMany({
      where: { categoryId: req.params.id, userId: req.userId },
      data: { categoryId: otherCategory.id }
    });

    // Delete category budgets
    await prisma.categoryBudget.deleteMany({
      where: { categoryId: req.params.id, userId: req.userId }
    });

    // Delete recurring expenses for this category
    await prisma.recurringExpense.deleteMany({
      where: { categoryId: req.params.id, userId: req.userId }
    });

    await prisma.category.delete({ where: { id: req.params.id } });

    res.json({ message: 'Category deleted. Expenses moved to "Other".' });
  } catch (error) {
    next(error);
  }
}
