import prisma from '../../lib/prisma.js';

const DEFAULT_THRESHOLD_SETTINGS = {
  thresholdMode: 'fixed',
  normalLimit: 500,
  mediumLimit: 1000,
  normalMultiplier: 1.0,
  mediumMultiplier: 1.5
};

/**
 * Parse a calendar key without letting JavaScript treat it as midnight UTC.
 * `new Date('YYYY-MM-DD')` shifts to the previous local day in timezones west
 * of UTC, which made calendar clicks display the wrong transactions.
 */
function parseCalendarDate(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) return null;

  return date;
}

function classifySpending(dailyTotal, settings) {
  if (settings.thresholdMode === 'average') {
    return { dailyTotal, status: 'pending' }; // Calculated below with average
  }
  // Fixed mode
  if (dailyTotal <= 0) return 'none';
  if (dailyTotal <= settings.normalLimit) return 'normal';
  if (dailyTotal <= settings.mediumLimit) return 'medium';
  return 'high';
}

function classifyWithAverage(dailyTotal, avgDaily, settings) {
  if (dailyTotal <= 0) return 'none';
  if (dailyTotal < avgDaily * settings.normalMultiplier) return 'normal';
  if (dailyTotal <= avgDaily * settings.mediumMultiplier) return 'medium';
  return 'high';
}

export async function getSummary(req, res, next) {
  try {
    const userId = req.userId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSpent, todaySpent, weekSpent, monthSpent, recentExpenses, topCategories] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: todayStart } },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: weekStart } },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart } },
        _sum: { amount: true }
      }),
      prisma.expense.findMany({
        where: { userId },
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { date: 'desc' },
        take: 5
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5
      })
    ]);

    // Get category names for top categories
    const categoryIds = topCategories.map(c => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true }
    });
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });

    const total = totalSpent._sum.amount || 0;

    res.json({
      totalSpent: total,
      todaySpent: todaySpent._sum.amount || 0,
      weekSpent: weekSpent._sum.amount || 0,
      monthSpent: monthSpent._sum.amount || 0,
      recentExpenses,
      topCategories: topCategories.map(tc => ({
        ...(categoryMap[tc.categoryId] || {}),
        totalSpent: tc._sum.amount || 0,
        percentage: total > 0 ? Math.round(((tc._sum.amount || 0) / total) * 100) : 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyAnalytics(req, res, next) {
  try {
    const userId = req.userId;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get daily spending for this month
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      select: { amount: true, date: true }
    });

    // Group by day
    const dailySpending = {};
    expenses.forEach(exp => {
      const day = new Date(exp.date).getDate();
      dailySpending[day] = (dailySpending[day] || 0) + exp.amount;
    });

    // Fill all days
    const daysInMonth = endDate.getDate();
    const dailyData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dailyData.push({ day: d, amount: Math.round((dailySpending[d] || 0) * 100) / 100 });
    }

    // Get previous month for comparison
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevTotal = await prisma.expense.aggregate({
      where: { userId, date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true }
    });

    const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = prevTotal._sum.amount || 0;
    const changePercent = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 1000) / 10
      : null;

    res.json({
      year,
      month,
      currentTotal: Math.round(currentTotal * 100) / 100,
      previousTotal: Math.round(previousTotal * 100) / 100,
      changePercent,
      dailyData,
      transactionCount: expenses.length
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyAnalytics(req, res, next) {
  try {
    const userId = req.userId;
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      select: { amount: true, date: true }
    });

    const dailySpending = {};
    expenses.forEach(exp => {
      const dateKey = new Date(exp.date).toISOString().split('T')[0];
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + exp.amount;
    });

    const data = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      data.push({ date: key, amount: Math.round((dailySpending[key] || 0) * 100) / 100 });
    }

    const totalDays = data.filter(d => d.amount > 0).length || 1;
    const totalSpent = data.reduce((s, d) => s + d.amount, 0);

    res.json({
      data,
      averageDaily: Math.round((totalSpent / totalDays) * 100) / 100,
      highestDay: data.reduce((max, d) => d.amount > max.amount ? d : max, { date: '', amount: 0 })
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryAnalytics(req, res, next) {
  try {
    const userId = req.userId;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const categorySpending = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true
    });

    const categoryIds = categorySpending.map(c => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true }
    });
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });

    const total = categorySpending.reduce((sum, c) => sum + (c._sum.amount || 0), 0);

    const data = categorySpending
      .map(cs => ({
        ...(categoryMap[cs.categoryId] || { name: 'Unknown' }),
        totalSpent: Math.round((cs._sum.amount || 0) * 100) / 100,
        transactionCount: cs._count,
        percentage: total > 0 ? Math.round(((cs._sum.amount || 0) / total) * 100) : 0
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({ categories: data, totalSpent: Math.round(total * 100) / 100 });
  } catch (error) {
    next(error);
  }
}

export async function getInsights(req, res, next) {
  try {
    const userId = req.userId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [monthExpenses, prevMonthTotal, allExpenses, topCategory, topMerchant] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart } },
        _sum: { amount: true },
        _count: true
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true }
      }),
      prisma.expense.findMany({
        where: { userId },
        select: { amount: true, date: true }
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: monthStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1
      }),
      prisma.expense.groupBy({
        by: ['merchant'],
        where: { userId, date: { gte: monthStart }, merchant: { not: '' } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 5
      })
    ]);

    const insights = [];
    const currentMonthSpent = monthExpenses._sum.amount || 0;
    const prevSpent = prevMonthTotal._sum.amount || 0;

    // Month-over-month comparison
    if (prevSpent > 0) {
      const change = ((currentMonthSpent - prevSpent) / prevSpent) * 100;
      if (change > 0) {
        insights.push({
          type: 'comparison',
          text: `You spent ${Math.abs(Math.round(change))}% more this month than last month.`,
          value: Math.round(change)
        });
      } else if (change < 0) {
        insights.push({
          type: 'comparison',
          text: `You spent ${Math.abs(Math.round(change))}% less this month than last month.`,
          value: Math.round(change)
        });
      }
    }

    // Top category
    if (topCategory.length > 0) {
      const cat = await prisma.category.findUnique({
        where: { id: topCategory[0].categoryId },
        select: { name: true, icon: true }
      });
      if (cat) {
        insights.push({
          type: 'topCategory',
          text: `${cat.icon} ${cat.name} is your highest spending category this month.`,
          value: topCategory[0]._sum.amount
        });
      }
    }

    // Average daily spending
    const uniqueDays = new Set(allExpenses.map(e => new Date(e.date).toISOString().split('T')[0]));
    if (uniqueDays.size > 0) {
      const totalSpent = allExpenses.reduce((s, e) => s + e.amount, 0);
      const avgDaily = totalSpent / uniqueDays.size;
      insights.push({
        type: 'averageDaily',
        text: `Your average daily spending is ${Math.round(avgDaily)}.`,
        value: Math.round(avgDaily * 100) / 100
      });
    }

    // Highest spending day this month
    const monthExpensesList = await prisma.expense.findMany({
      where: { userId, date: { gte: monthStart } },
      select: { amount: true, date: true }
    });
    const dailyTotals = {};
    monthExpensesList.forEach(e => {
      const dateKey = new Date(e.date).toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + e.amount;
    });
    const highestDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
    if (highestDay) {
      const dayDate = new Date(highestDay[0]);
      const formatted = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      insights.push({
        type: 'highestDay',
        text: `Your highest spending day this month was ${formatted}.`,
        value: Math.round(highestDay[1] * 100) / 100
      });
    }

    // Transaction count
    if (monthExpenses._count > 0) {
      insights.push({
        type: 'transactionCount',
        text: `You made ${monthExpenses._count} transactions this month.`,
        value: monthExpenses._count
      });
    }

    // Top merchants
    if (topMerchant.length > 0) {
      insights.push({
        type: 'topMerchants',
        text: `Your top merchant this month is ${topMerchant[0].merchant}.`,
        merchants: topMerchant.map(m => ({
          name: m.merchant,
          amount: m._sum.amount,
          count: m._count
        }))
      });
    }

    res.json({ insights });
  } catch (error) {
    next(error);
  }
}

export async function getCalendarData(req, res, next) {
  try {
    const userId = req.userId;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get settings for threshold calculation
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    const thresholdSettings = settings || DEFAULT_THRESHOLD_SETTINGS;

    // Get all expenses for the month
    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      // Prisma does not allow `select` and `include` together. Select the
      // relation inside the field selection so the calendar endpoint can
      // return daily totals without throwing a 500 error.
      select: {
        id: true,
        amount: true,
        date: true,
        merchant: true,
        categoryId: true,
        note: true,
        paymentMethod: true,
        category: { select: { name: true, icon: true, color: true } }
      }
    });

    // Group by day
    const dailyData = {};
    expenses.forEach(exp => {
      const day = new Date(exp.date).getDate();
      if (!dailyData[day]) {
        dailyData[day] = { totalSpent: 0, expenses: [] };
      }
      dailyData[day].totalSpent += exp.amount;
      dailyData[day].expenses.push(exp);
    });

    // Calculate average for average-based thresholds
    let avgDaily = 0;
    if (thresholdSettings.thresholdMode === 'average') {
      const allExpenses = await prisma.expense.findMany({
        where: { userId },
        select: { amount: true, date: true }
      });
      const dailyTotals = {};
      allExpenses.forEach(e => {
        const key = new Date(e.date).toISOString().split('T')[0];
        dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
      });
      const days = Object.values(dailyTotals);
      avgDaily = days.length > 0 ? days.reduce((s, d) => s + d, 0) / days.length : 0;
    }

    // Build calendar data
    const daysInMonth = endDate.getDate();
    const calendarDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const data = dailyData[d] || { totalSpent: 0, expenses: [] };
      let status;

      if (data.totalSpent <= 0) {
        status = 'none';
      } else if (thresholdSettings.thresholdMode === 'average') {
        status = classifyWithAverage(data.totalSpent, avgDaily, thresholdSettings);
      } else {
        status = classifySpending(data.totalSpent, thresholdSettings);
      }

      calendarDays.push({
        day: d,
        // Build the key directly so its value cannot shift when the server's
        // timezone is ahead of or behind UTC.
        date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        totalSpent: Math.round(data.totalSpent * 100) / 100,
        status,
        transactionCount: data.expenses.length
      });
    }

    res.json({
      year,
      month,
      days: calendarDays,
      thresholdSettings: {
        mode: thresholdSettings.thresholdMode,
        normalLimit: thresholdSettings.normalLimit,
        mediumLimit: thresholdSettings.mediumLimit,
        normalMultiplier: thresholdSettings.normalMultiplier,
        mediumMultiplier: thresholdSettings.mediumMultiplier,
        averageDaily: Math.round(avgDaily * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDateDetails(req, res, next) {
  try {
    const userId = req.userId;
    const dateStr = req.params.date;
    const date = parseCalendarDate(dateStr);

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      orderBy: { amount: 'desc' }
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get spending status
    const settings = await prisma.userSettings.findUnique({ where: { userId } }) || DEFAULT_THRESHOLD_SETTINGS;
    let status = 'none';
    if (totalSpent > 0) {
      if (settings.thresholdMode === 'average') {
        const allExpenses = await prisma.expense.findMany({
          where: { userId },
          select: { amount: true, date: true }
        });
        const dailyTotals = {};
        allExpenses.forEach(e => {
          const key = new Date(e.date).toISOString().split('T')[0];
          dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
        });
        const days = Object.values(dailyTotals);
        const avg = days.length > 0 ? days.reduce((s, d) => s + d, 0) / days.length : 0;
        status = classifyWithAverage(totalSpent, avg, settings);
      } else {
        status = classifySpending(totalSpent, settings);
      }
    }

    // Group by category
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      const catName = exp.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = {
          ...exp.category,
          totalSpent: 0,
          expenses: []
        };
      }
      categoryBreakdown[catName].totalSpent += exp.amount;
      categoryBreakdown[catName].expenses.push(exp);
    });

    res.json({
      date: dateStr,
      totalSpent: Math.round(totalSpent * 100) / 100,
      status,
      transactionCount: expenses.length,
      expenses,
      categoryBreakdown: Object.values(categoryBreakdown)
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentMethodAnalytics(req, res, next) {
  try {
    const userId = req.userId;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const paymentData = await prisma.expense.groupBy({
      by: ['paymentMethod'],
      where: { userId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true
    });

    const total = paymentData.reduce((sum, p) => sum + (p._sum.amount || 0), 0);

    res.json({
      data: paymentData.map(p => ({
        method: p.paymentMethod,
        amount: Math.round((p._sum.amount || 0) * 100) / 100,
        count: p._count,
        percentage: total > 0 ? Math.round(((p._sum.amount || 0) / total) * 100) : 0
      })).sort((a, b) => b.amount - a.amount)
    });
  } catch (error) {
    next(error);
  }
}
