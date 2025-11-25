import express from 'express';
import ListingsController from '../controllers/listingsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/listings
 * Get all listings for authenticated user
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'archived', 'sold']),
    query('search').optional().isString().trim(),
    query('sort').optional().isIn(['date_desc', 'date_asc', 'price_desc', 'price_asc', 'title_asc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ListingsController.getListings
);

/**
 * POST /api/listings/sync
 * Sync listings from Avito
 */
router.post(
  '/sync',
  ListingsController.syncListings
);

/**
 * GET /api/listings/:id
 * Get single listing by ID
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Некорректный ID объявления'),
  ],
  ListingsController.getListingById
);

/**
 * PATCH /api/listings/:id
 * Update listing
 */
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('Некорректный ID объявления'),
    body('title').optional().isString().trim().isLength({ min: 1, max: 500 }),
    body('description').optional().isString().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'archived', 'sold']),
    body('category').optional().isString().trim(),
  ],
  ListingsController.updateListing
);

/**
 * PATCH /api/listings/:id/price
 * Update listing price
 */
router.patch(
  '/:id/price',
  [
    param('id').isUUID().withMessage('Некорректный ID объявления'),
    body('newPrice').isFloat({ min: 0 }).withMessage('Некорректная цена'),
  ],
  ListingsController.updatePrice
);

/**
 * DELETE /api/listings/:id
 * Delete listing
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Некорректный ID объявления'),
  ],
  ListingsController.deleteListing
);

/**
 * GET /api/listings/:id/stats
 * Get listing statistics
 */
router.get(
  '/:id/stats',
  [
    param('id').isUUID().withMessage('Некорректный ID объявления'),
  ],
  ListingsController.getListingStats
);

export default router;
