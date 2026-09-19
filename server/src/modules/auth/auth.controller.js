import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/prisma.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Education', icon: '📚', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎮', color: '#06b6d4' },
  { name: 'Bills', icon: '📄', color: '#ef4444' },
  { name: 'Health', icon: '🏥', color: '#10b981' },
  { name: 'Travel', icon: '✈️', color: '#f59e0b' },
  { name: 'Other', icon: '📦', color: '#6b7280' }
];

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

async function createDefaultData(userId) {
  // Create default categories
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(cat => ({
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: true
    }))
  });

  // Create default settings
  await prisma.userSettings.create({
    data: { userId }
  });

  // Create default profile
  await prisma.profile.create({
    data: { userId }
  });
}

export async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.validatedBody;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash }
    });

    await createDefaultData(user.id);

    // Update profile with fullName
    await prisma.profile.update({
      where: { userId: user.id },
      data: { fullName }
    });

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(201).json({
      user: { id: user.id, email: user.email, fullName }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedBody;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || ''
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true, settings: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || '',
        avatarUrl: user.profile?.avatarUrl || null,
        hasPassword: !!user.passwordHash,
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validatedBody;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    const resetTokenExp = new Date(Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_HOURS) || 1) * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp }
    });

    // In development, log the token. In production, send email.
    console.log(`\n🔑 Password Reset Token for ${email}: ${resetToken}\n`);

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.validatedBody;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gte: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
}
