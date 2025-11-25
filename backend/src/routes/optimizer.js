import express from 'express';
import OptimizerController from '../controllers/optimizerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * POST /api/optimize/price
 * Get AI price recommendation for a listing
 */
router.post(
  '/price',
  [
    body('listingId').isUUID().withMessage('Некорректный ID объявления'),
  ],
  OptimizerController.getPriceRecommendation
);

/**
 * GET /api/optimize/price-distribution/:listingId
 * Get price distribution for charts
 */
router.get(
  '/price-distribution/:listingId',
  [
    param('listingId').isUUID().withMessage('Некорректный ID объявления'),
  ],
  OptimizerController.getPriceDistribution
);

/**
 * GET /api/optimize/price-trends/:listingId
 * Get price trends over time
 */
router.get(
  '/price-trends/:listingId',
  [
    param('listingId').isUUID().withMessage('Некорректный ID объявления'),
    query('days').optional().isInt({ min: 1, max: 90 }),
  ],
  OptimizerController.getPriceTrends
);

/**
 * GET /api/optimize/price-range/:listingId
 * Get optimal price range
 */
router.get(
  '/price-range/:listingId',
  [
    param('listingId').isUUID().withMessage('Некорректный ID объявления'),
  ],
  OptimizerController.getPriceRange
);

export default router;
