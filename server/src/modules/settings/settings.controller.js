import { z } from 'zod';
import prisma from '../../lib/prisma.js';

const settingsSchema = z.object({
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  thresholdMode: z.enum(['fixed', 'average']).optional(),
  normalLimit: z.number().positive().max(99999999).optional(),
  mediumLimit: z.number().positive().max(99999999).optional(),
  normalMultiplier: z.number().positive().max(10).optional(),
  mediumMultiplier: z.number().positive().max(10).optional()
});

export async function getSettings(req, res, next) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId }
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.userId }
      });
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const result = settingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', errors: result.error.issues });
    }

    // Validate medium > normal for fixed mode
    if (result.data.normalLimit && result.data.mediumLimit) {
      if (result.data.mediumLimit <= result.data.normalLimit) {
        return res.status(400).json({ error: 'Medium limit must be greater than normal limit' });
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: result.data,
      create: { userId: req.userId, ...result.data }
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
}
