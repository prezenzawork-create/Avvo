import express from 'express';
import AnalyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { query } from 'express-validator';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get(
  '/dashboard/stats',
  AnalyticsController.getDashboardStats
);

/**
 * GET /api/analytics/listings
 * Get listing analytics
 */
router.get(
  '/analytics/listings',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('listingId').optional().isUUID(),
  ],
  AnalyticsController.getListingAnalytics
);

/**
 * GET /api/analytics/competitors
 * Get competitor analytics
 */
router.get(
  '/analytics/competitors',
  [
    query('listingId').isUUID().withMessage('Некорректный ID объявления'),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  AnalyticsController.getCompetitorAnalytics
);

/**
 * GET /api/analytics/export
 * Export analytics data
 */
router.get(
  '/analytics/export',
  [
    query('format').optional().isIn(['csv', 'json']),
    query('type').optional().isIn(['listings', 'competitors', 'chats']),
  ],
  AnalyticsController.exportAnalytics
);

/**
 * GET /api/analytics/performance
 * Get performance summary
 */
router.get(
  '/analytics/performance',
  [
    query('period').optional().isInt({ min: 1, max: 365 }),
  ],
  AnalyticsController.getPerformanceSummary
);

export default router;
