import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import expenseRoutes from './modules/expenses/expenses.routes.js';
import categoryRoutes from './modules/categories/categories.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import budgetRoutes from './modules/budgets/budgets.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import exportRoutes from './modules/export/export.routes.js';

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false // Let frontend handle CSP
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
