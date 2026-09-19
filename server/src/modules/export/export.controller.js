import prisma from '../../lib/prisma.js';

export async function exportData(req, res, next) {
  try {
    const format = req.params.format;
    const userId = req.userId;

    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Supported formats: csv, json' });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId },
      include: { category: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });

    if (format === 'json') {
      const data = expenses.map(e => ({
        date: new Date(e.date).toISOString().split('T')[0],
        amount: e.amount,
        category: e.category.name,
        merchant: e.merchant,
        note: e.note,
        paymentMethod: e.paymentMethod
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.json');
      return res.json(data);
    }

    if (format === 'csv') {
      const header = 'Date,Amount,Category,Merchant,Note,Payment Method\n';
      const rows = expenses.map(e => {
        const date = new Date(e.date).toISOString().split('T')[0];
        const merchant = `"${(e.merchant || '').replace(/"/g, '""')}"`;
        const note = `"${(e.note || '').replace(/"/g, '""')}"`;
        return `${date},${e.amount},${e.category.name},${merchant},${note},${e.paymentMethod}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
      return res.send(header + rows);
    }
  } catch (error) {
    next(error);
  }
}
