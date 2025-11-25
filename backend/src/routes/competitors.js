import express from 'express';
import CompetitorController from '../controllers/competitorController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/competitors
 * Get competitors for a listing
 */
router.get(
  '/',
  [
    query('listing_id').isUUID().withMessage('Некорректный ID объявления'),
  ],
  CompetitorController.getCompetitors
);

/**
 * POST /api/competitors/parse
 * Parse competitors for a listing
 */
router.post(
  '/parse',
  [
    body('listingId').isUUID().withMessage('Некорректный ID объявления'),
  ],
  CompetitorController.parseCompetitors
);

/**
 * GET /api/competitors/stats
 * Get competitor statistics
 */
router.get(
  '/stats',
  [
    query('listing_id').isUUID().withMessage('Некорректный ID объявления'),
  ],
  CompetitorController.getCompetitorStats
);

/**
 * GET /api/competitors/trends
 * Get competitor price trends
 */
router.get(
  '/trends',
  [
    query('listing_id').isUUID().withMessage('Некорректный ID объявления'),
    query('days').optional().isInt({ min: 1, max: 90 }),
  ],
  CompetitorController.getPriceTrends
);

/**
 * DELETE /api/competitors/old
 * Delete old competitor data
 */
router.delete(
  '/old',
  [
    query('daysOld').optional().isInt({ min: 1 }),
  ],
  CompetitorController.deleteOldCompetitors
);

export default router;
