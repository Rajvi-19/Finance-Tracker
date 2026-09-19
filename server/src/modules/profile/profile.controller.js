import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
});

export async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true }
    });

    res.json({
      profile: {
        email: user.email,
        fullName: user.profile?.fullName || '',
        avatarUrl: user.profile?.avatarUrl || null,
        hasPassword: !!user.passwordHash,
        hasGoogle: !!user.googleId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', errors: result.error.issues });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      update: result.data,
      create: { userId: req.userId, ...result.data }
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', errors: result.error.issues });
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Account uses Google Sign-In. Set a password first.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    // Cascade delete will handle all related data
    await prisma.user.delete({ where: { id: req.userId } });

    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}
