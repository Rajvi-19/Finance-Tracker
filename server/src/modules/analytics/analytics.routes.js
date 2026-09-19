import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import {
  getSummary, getMonthlyAnalytics, getDailyAnalytics,
  getCategoryAnalytics, getInsights, getCalendarData,
  getDateDetails, getPaymentMethodAnalytics
} from './analytics.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyAnalytics);
router.get('/daily', getDailyAnalytics);
router.get('/categories', getCategoryAnalytics);
router.get('/insights', getInsights);
router.get('/calendar', getCalendarData);
router.get('/calendar/:date', getDateDetails);
router.get('/payment-methods', getPaymentMethodAnalytics);

export default router;
